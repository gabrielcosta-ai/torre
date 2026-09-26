import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server';
import { q } from '@/lib/db';
import { hostTorre } from '@/lib/env';
import { ErroHttp, lerJson, objeto, rota } from '@/lib/http';
import { comCookies } from '@/lib/passkey';
import { COOKIE_DESAFIO, cookieDesafioApagado, cookieSessao, lerCookie, lerDesafio } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

type Pk = { id: string; public_key: string; counter: string | number; transports: string[] };

export const POST = rota(async (req) => {
  const desafio = await lerDesafio(lerCookie(req, COOKIE_DESAFIO));
  if (!desafio || desafio.t !== 'login') throw new ErroHttp(400, 'o pedido expirou; tente de novo');
  const corpo = objeto(await lerJson(req));
  const resposta = objeto(corpo.resposta, 'resposta') as unknown as AuthenticationResponseJSON;
  if (typeof resposta.id !== 'string') throw new ErroHttp(400, 'resposta sem id');

  const [pk] = await q<Pk>('select id, public_key, counter, transports from passkeys where id = $1', [resposta.id]);
  if (!pk) throw new ErroHttp(401, 'esta chave não está cadastrada na Torre');

  const { rpID, origin } = hostTorre();
  let verif;
  try {
    verif = await verifyAuthenticationResponse({
      response: resposta,
      expectedChallenge: desafio.d,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: pk.id,
        publicKey: new Uint8Array(Buffer.from(pk.public_key, 'base64url')),
        counter: Number(pk.counter),
        transports: pk.transports || [],
      },
    });
  } catch (e) {
    throw new ErroHttp(401, `chave recusada: ${(e as Error).message}`);
  }
  if (!verif.verified) throw new ErroHttp(401, 'chave recusada');

  await q('update passkeys set counter = $1, ultimo_uso = now() where id = $2', [verif.authenticationInfo.newCounter, pk.id]);
  return comCookies({ ok: true }, [await cookieSessao(pk.id), cookieDesafioApagado()]);
});
