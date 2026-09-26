import { createHash, timingSafeEqual } from 'node:crypto';
import { q } from './db';
import { envOpc, hostTorre } from './env';
import { ErroHttp } from './http';
import { COOKIE_SESSAO, lerCookie, lerSessao } from './sessao';

export type Quem = { tipo: 'gabriel'; passkey: string } | { tipo: 'agente' };

function hash(s: string) {
  return createHash('sha256').update(s, 'utf8').digest();
}

/** Comparação em tempo constante (compara os hashes, então tamanhos diferentes não vazam). */
export function iguais(a: string, b: string): boolean {
  return timingSafeEqual(hash(a), hash(b));
}

const MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Toda rota da API (menos /api/saude e o fluxo de passkey) passa por aqui.
 * Agente: Authorization: Bearer TORRE_AGENT_TOKEN. Gabriel: cookie de sessão + passkey ainda cadastrada.
 * Com cookie, requisição que grava precisa vir da própria origem (defesa extra contra CSRF).
 */
export async function autenticar(req: Request): Promise<Quem> {
  const authz = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(authz);
  if (m) {
    const token = envOpc('TORRE_AGENT_TOKEN');
    if (token && token.length >= 16 && iguais(m[1].trim(), token)) return { tipo: 'agente' };
    throw new ErroHttp(401, 'token inválido');
  }

  const sessao = await lerSessao(lerCookie(req, COOKIE_SESSAO));
  if (!sessao) throw new ErroHttp(401, 'não autenticado');

  if (MUTANTES.has(req.method)) {
    const origem = req.headers.get('origin');
    if (origem !== hostTorre().origin) throw new ErroHttp(401, 'origem não permitida');
  }

  const [pk] = await q<{ id: string }>('select id from passkeys where id = $1', [sessao.pk]);
  if (!pk) throw new ErroHttp(401, 'aparelho removido; entre de novo');
  return { tipo: 'gabriel', passkey: sessao.pk };
}

export async function exigirGabriel(req: Request): Promise<Quem & { tipo: 'gabriel' }> {
  const quem = await autenticar(req);
  if (quem.tipo !== 'gabriel') throw new ErroHttp(401, 'só a sessão do Gabriel pode fazer isto');
  return quem;
}
