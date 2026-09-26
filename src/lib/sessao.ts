import { SignJWT, jwtVerify } from 'jose';
import { segredoSessao, hostTorre } from './env';

export const COOKIE_SESSAO = 'torre_sessao';
export const COOKIE_DESAFIO = 'torre_desafio';
const TRINTA_DIAS = 30 * 24 * 3600;
const CINCO_MIN = 5 * 60;

export type Sessao = { pk: string };
export type Desafio = {
  d: string; // challenge
  t: 'registro' | 'login';
  modo?: 'setup' | 'convite' | 'sessao';
  cid?: number; // id do convite
  ap?: string; // nome do aparelho
};

async function assinar(payload: Record<string, unknown>, aud: string, segundos: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(aud)
    .setIssuer('torre')
    .setExpirationTime(Math.floor(Date.now() / 1000) + segundos)
    .sign(segredoSessao());
}

async function verificar(token: string | undefined | null, aud: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredoSessao(), { audience: aud, issuer: 'torre', algorithms: ['HS256'] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function lerSessao(token: string | undefined | null): Promise<Sessao | null> {
  const p = await verificar(token, 'sessao');
  return p && typeof p.pk === 'string' ? { pk: p.pk } : null;
}

export async function lerDesafio(token: string | undefined | null): Promise<Desafio | null> {
  const p = await verificar(token, 'desafio');
  return p && typeof p.d === 'string' && (p.t === 'registro' || p.t === 'login') ? (p as unknown as Desafio) : null;
}

function atributos(maxAge: number, path = '/') {
  const seguro = !hostTorre().local;
  return [`Path=${path}`, `Max-Age=${maxAge}`, 'HttpOnly', 'SameSite=Lax', seguro ? 'Secure' : ''].filter(Boolean).join('; ');
}

export async function cookieSessao(pk: string): Promise<string> {
  const t = await assinar({ pk }, 'sessao', TRINTA_DIAS);
  return `${COOKIE_SESSAO}=${t}; ${atributos(TRINTA_DIAS)}`;
}

export function cookieSessaoApagada(): string {
  return `${COOKIE_SESSAO}=; ${atributos(0)}`;
}

export async function cookieDesafio(d: Desafio): Promise<string> {
  const t = await assinar(d as unknown as Record<string, unknown>, 'desafio', CINCO_MIN);
  return `${COOKIE_DESAFIO}=${t}; ${atributos(CINCO_MIN, '/api/auth')}`;
}

export function cookieDesafioApagado(): string {
  return `${COOKIE_DESAFIO}=; ${atributos(0, '/api/auth')}`;
}

export function lerCookie(req: Request, nome: string): string | null {
  const bruto = req.headers.get('cookie');
  if (!bruto) return null;
  for (const parte of bruto.split(';')) {
    const i = parte.indexOf('=');
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}
