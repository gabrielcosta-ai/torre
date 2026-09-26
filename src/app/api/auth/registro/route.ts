import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server';
import { q } from '@/lib/db';
import { hostTorre } from '@/lib/env';
import { ErroHttp, lerJson, objeto, rota } from '@/lib/http';
import { comCookies } from '@/lib/passkey';
import {
  COOKIE_DESAFIO, COOKIE_SESSAO, cookieDesafioApagado, cookieSessao, lerCookie, lerDesafio, lerSessao,
} from '@/lib/sessao';

export const dynamic = 'force-dynamic';

const INSERIR = `insert into passkeys (id, public_key, counter, transports, aparelho)`;

/**
 * Confere a passkey recém-criada e grava. O código (setup ou convite) é consumido na MESMA
 * instrução que insere a passkey: sem código válido, nada é gravado (e não dá para usar 2 vezes).
 */
export const POST = rota(async (req) => {
  const desafio = await lerDesafio(lerCookie(req, COOKIE_DESAFIO));
  if (!desafio || desafio.t !== 'registro') throw new ErroHttp(400, 'o pedido expirou; comece de novo');
  const corpo = objeto(await lerJson(req));
  const resposta = objeto(corpo.resposta, 'resposta') as unknown as RegistrationResponseJSON;
  const { rpID, origin } = hostTorre();

  let verif;
  try {
    verif = await verifyRegistrationResponse({
      response: resposta,
      expectedChallenge: desafio.d,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    throw new ErroHttp(400, `passkey recusada: ${(e as Error).message}`);
  }
  if (!verif.verified) throw new ErroHttp(400, 'passkey recusada');

  const cred = verif.registrationInfo.credential;
  const valores = [
    cred.id,
    Buffer.from(cred.publicKey).toString('base64url'),
    cred.counter,
    JSON.stringify(cred.transports || []),
    desafio.ap || 'aparelho',
  ];

  let linhas: { id: string }[] = [];
  if (desafio.modo === 'setup') {
    linhas = await q<{ id: string }>(
      `with ok as (update config set valor = 'true' where chave = 'setup_usado' and valor <> 'true' returning 1)
       ${INSERIR} select $1, $2, $3, $4::jsonb, $5 from ok returning id`,
      valores,
    );
    if (!linhas.length) throw new ErroHttp(401, 'o código de setup já foi usado; peça um convite a um aparelho logado');
  } else if (desafio.modo === 'convite' && typeof desafio.cid === 'number') {
    linhas = await q<{ id: string }>(
      `with ok as (update convites set usado_em = now()
                    where id = $6 and usado_em is null and expira_em > now() returning 1)
       ${INSERIR} select $1, $2, $3, $4::jsonb, $5 from ok returning id`,
      [...valores, desafio.cid],
    );
    if (!linhas.length) throw new ErroHttp(401, 'convite já usado ou expirado');
  } else if (desafio.modo === 'sessao') {
    const sessao = await lerSessao(lerCookie(req, COOKIE_SESSAO));
    const [pk] = sessao ? await q('select id from passkeys where id = $1', [sessao.pk]) : [];
    if (!pk) throw new ErroHttp(401, 'sessão expirada; entre de novo');
    linhas = await q<{ id: string }>(`${INSERIR} values ($1, $2, $3, $4::jsonb, $5) returning id`, valores);
  } else {
    throw new ErroHttp(400, 'o pedido expirou; comece de novo');
  }

  return comCookies({ ok: true, aparelho: desafio.ap }, [await cookieSessao(linhas[0].id), cookieDesafioApagado()]);
});
