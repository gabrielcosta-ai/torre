import { ErroConfig } from './http';

export function envObrig(nome: string): string {
  const v = process.env[nome];
  if (!v || !v.trim()) throw new ErroConfig(nome);
  return v.trim();
}

export function envOpc(nome: string): string | null {
  const v = process.env[nome];
  return v && v.trim() ? v.trim() : null;
}

/** Host público (TORRE_HOST): rpID das passkeys (sem porta) e origem esperada. */
export function hostTorre() {
  const bruto = envObrig('TORRE_HOST').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const rpID = bruto.replace(/:\d+$/, '');
  const local = rpID === 'localhost' || rpID === '127.0.0.1';
  return { host: bruto, rpID, origin: `${local ? 'http' : 'https'}://${bruto}`, local };
}

export function fusoTorre(): string {
  return envOpc('TORRE_TZ') || 'America/Sao_Paulo';
}

export function segredoSessao(): Uint8Array {
  const s = envObrig('TORRE_SESSION_SECRET');
  if (s.length < 32) throw new ErroConfig('TORRE_SESSION_SECRET', 'curta demais (mín. 32 caracteres)');
  return new TextEncoder().encode(s);
}
