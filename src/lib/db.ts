import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { ErroConfig } from './http';

export type Linha = Record<string, unknown>;

let _sql: NeonQueryFunction<false, false> | null = null;

/** Cliente HTTP do Neon (uma conexão por requisição, sem pool; ideal para serverless). */
export function sql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new ErroConfig('DATABASE_URL');
    _sql = neon(url);
  }
  return _sql;
}

export async function q<T extends Linha = Linha>(texto: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(texto, params)) as T[];
}

/** Colunas que o driver devolve como string (bigint/numeric) e a API devolve como número. */
const NUMERICAS = new Set([
  'tokens_in', 'tokens_out', 'cache_read', 'cache_create', 'usd_estimado', 'usado_pct', 'counter',
]);

/** Linha do banco -> JSON da API: Date vira ISO (UTC), bigint/numeric vira número. */
export function serial<T extends Linha>(l: T): T {
  const o: Linha = {};
  for (const [k, v] of Object.entries(l)) {
    if (v instanceof Date) o[k] = v.toISOString();
    else if (NUMERICAS.has(k) && typeof v === 'string') o[k] = Number(v);
    else o[k] = v;
  }
  return o as T;
}

export function seriais<T extends Linha>(ls: T[]): T[] {
  return ls.map(serial);
}
