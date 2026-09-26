import { createHmac, randomInt } from 'node:crypto';
import { q } from './db';
import { envObrig } from './env';
import { json } from './http';

export const RP_NOME = 'Torre';
/** Usuário único (o Gabriel). id estável para o autenticador agrupar as chaves. */
export const USUARIO = { nome: 'gabriel', exibicao: 'Gabriel', id: new TextEncoder().encode('torre-gabriel') };

export const MAX_TENTATIVAS = 5;
export const MINUTOS_CONVITE = 10;

/** Hash do código de convite com o segredo da sessão (6 dígitos sem segredo cairiam por força bruta offline). */
export function hashConvite(codigo: string): string {
  return createHmac('sha256', envObrig('TORRE_SESSION_SECRET')).update(`convite:${codigo}`).digest('hex');
}

export function novoCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function nomeAparelho(v: unknown): string {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  return s || 'aparelho';
}

export async function passkeysCadastradas(): Promise<{ id: string; transports: string[] }[]> {
  return q<{ id: string; transports: string[] }>('select id, transports from passkeys');
}

/** Resposta JSON com vários Set-Cookie. */
export function comCookies(dados: unknown, cookies: string[], status = 200): Response {
  const r = json(dados, status);
  for (const c of cookies) r.headers.append('Set-Cookie', c);
  return r;
}
