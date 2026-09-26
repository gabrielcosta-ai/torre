import { generateRegistrationOptions } from '@simplewebauthn/server';
import { iguais } from '@/lib/auth';
import { q } from '@/lib/db';
import { envOpc, hostTorre } from '@/lib/env';
import { ErroHttp, rota } from '@/lib/http';
import {
  MAX_TENTATIVAS, RP_NOME, USUARIO, comCookies, hashConvite, nomeAparelho, passkeysCadastradas,
} from '@/lib/passkey';
import { COOKIE_SESSAO, type Desafio, cookieDesafio, lerCookie, lerSessao } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/**
 * Opções para cadastrar a passkey deste aparelho.
 * Código no header X-Torre-Codigo (não vai para log de URL): TORRE_SETUP_CODE (só o 1º cadastro)
 * ou o código de 6 dígitos gerado em "Adicionar aparelho". Com sessão válida, dispensa código.
 * ?aparelho=<nome> (ex.: celular, PC).
 */
export const GET = rota(async (req) => {
  const u = new URL(req.url).searchParams;
  const aparelho = nomeAparelho(u.get('aparelho'));
  const codigo = (req.headers.get('x-torre-codigo') || '').trim();
  const { rpID } = hostTorre();

  let desafioBase: Omit<Desafio, 'd'> | null = null;

  const sessao = await lerSessao(lerCookie(req, COOKIE_SESSAO));
  if (sessao && !codigo) {
    const [pk] = await q('select id from passkeys where id = $1', [sessao.pk]);
    if (pk) desafioBase = { t: 'registro', modo: 'sessao', ap: aparelho };
  }

  if (!desafioBase) {
    if (!codigo) throw new ErroHttp(400, 'digite o código');
    const [cfg] = await q<{ valor: string }>("select valor from config where chave = 'setup_usado'");
    const setup = envOpc('TORRE_SETUP_CODE');
    if (cfg && cfg.valor !== 'true' && setup && iguais(codigo, setup)) {
      desafioBase = { t: 'registro', modo: 'setup', ap: aparelho };
    } else if (/^\d{6}$/.test(codigo)) {
      const [c] = await q<{ id: number }>(
        `select id from convites
          where codigo_hash = $1 and usado_em is null and expira_em > now() and tentativas < $2`,
        [hashConvite(codigo), MAX_TENTATIVAS],
      );
      if (c) desafioBase = { t: 'registro', modo: 'convite', cid: c.id, ap: aparelho };
    }
    if (!desafioBase) {
      // Erro conta contra os convites ativos: 5 erros derrubam o convite (força bruta de 6 dígitos).
      await q('update convites set tentativas = tentativas + 1 where usado_em is null and expira_em > now()');
      throw new ErroHttp(401, 'código inválido ou expirado');
    }
  }

  const existentes = await passkeysCadastradas();
  const opcoes = await generateRegistrationOptions({
    rpName: RP_NOME,
    rpID,
    userName: USUARIO.nome,
    userDisplayName: USUARIO.exibicao,
    userID: USUARIO.id,
    attestationType: 'none',
    excludeCredentials: existentes.map((p) => ({ id: p.id, transports: p.transports || [] })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
  const cookie = await cookieDesafio({ ...desafioBase, d: opcoes.challenge });
  return comCookies(opcoes, [cookie]);
});
