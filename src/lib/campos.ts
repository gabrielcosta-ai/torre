import { ErroHttp } from './http';
import { paraTs } from './tempo';

/** Validação de campos e montagem de upsert parametrizado (nada de dado concatenado no SQL). */

export type Tipo = 'texto' | 'int' | 'num' | 'bool' | 'json' | 'ts';
export type Campo = { tipo: Tipo; validar?: (v: unknown, campo: string) => void };
export type Esquema = Record<string, Campo>;

const CAST: Record<Tipo, string> = {
  texto: 'text', int: 'bigint', num: 'numeric', bool: 'boolean', json: 'jsonb', ts: 'timestamptz',
};
const MAX_TEXTO = 20000;

function converter(campo: string, c: Campo, v: unknown): unknown {
  if (v === undefined) return undefined;
  if (v === null) return null;
  switch (c.tipo) {
    case 'texto': {
      if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
      if (typeof v !== 'string') throw new ErroHttp(400, `${campo}: esperava texto`);
      if (v.length > MAX_TEXTO) throw new ErroHttp(400, `${campo}: texto longo demais`);
      c.validar?.(v, campo);
      return v;
    }
    case 'int':
    case 'num': {
      const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
      if (typeof n !== 'number' || !Number.isFinite(n)) throw new ErroHttp(400, `${campo}: esperava número`);
      return c.tipo === 'int' ? Math.round(n) : n;
    }
    case 'bool':
      if (typeof v !== 'boolean') throw new ErroHttp(400, `${campo}: esperava true/false`);
      return v;
    case 'json':
      if (typeof v !== 'object') throw new ErroHttp(400, `${campo}: esperava objeto ou lista JSON`);
      c.validar?.(v, campo);
      return JSON.stringify(v);
    case 'ts':
      return paraTs(v, campo);
  }
}

/** Mantém só as chaves presentes, convertidas; chave desconhecida = 400. */
export function limparLinha(
  esq: Esquema,
  obj: Record<string, unknown>,
  ignorar: string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (ignorar.includes(k)) continue;
    const c = esq[k];
    if (!c) throw new ErroHttp(400, `campo desconhecido: ${k}`);
    const x = converter(k, c, v);
    if (x !== undefined) out[k] = x;
  }
  return out;
}

/**
 * INSERT ... ON CONFLICT (pk) DO UPDATE só das colunas enviadas (null explícito limpa o campo).
 * `agora`: coluna carimbada com now() quando o cliente não a manda (ex.: atualizado_em).
 */
export function montarUpsert(
  tabela: string,
  pk: string,
  esq: Esquema,
  linha: Record<string, unknown>,
  agora?: string,
): { texto: string; params: unknown[] } {
  const cols = Object.keys(linha);
  const params = cols.map((k) => linha[k]);
  const valores = cols.map((k, i) => `$${i + 1}::${CAST[esq[k].tipo]}`);
  if (agora && !cols.includes(agora)) {
    cols.push(agora);
    valores.push('now()');
  }
  const sets = cols.filter((k) => k !== pk).map((k) => `${k} = excluded.${k}`);
  if (!sets.length) sets.push(`${pk} = excluded.${pk}`);
  const texto =
    `insert into ${tabela} (${cols.join(', ')}) values (${valores.join(', ')}) ` +
    `on conflict (${pk}) do update set ${sets.join(', ')} returning *`;
  return { texto, params };
}

/** UPDATE ... SET só das colunas enviadas. */
export function montarUpdate(
  tabela: string,
  pk: string,
  esq: Esquema,
  id: unknown,
  linha: Record<string, unknown>,
): { texto: string; params: unknown[] } {
  const cols = Object.keys(linha);
  const params: unknown[] = cols.map((k) => linha[k]);
  const sets = cols.map((k, i) => `${k} = $${i + 1}::${CAST[esq[k].tipo]}`);
  params.push(id);
  return {
    texto: `update ${tabela} set ${sets.join(', ')} where ${pk} = $${params.length} returning *`,
    params,
  };
}

/* ===== Validadores de JSON ===== */

export function listaDeTextos(max = 50) {
  return (v: unknown, campo: string) => {
    if (!Array.isArray(v) || v.length > max || v.some((x) => typeof x !== 'string')) {
      throw new ErroHttp(400, `${campo}: esperava lista de textos (até ${max})`);
    }
  };
}

export function listaDeObjetos(max: number, exigir: string[] = []) {
  return (v: unknown, campo: string) => {
    if (!Array.isArray(v) || v.length > max) throw new ErroHttp(400, `${campo}: esperava lista (até ${max})`);
    for (const x of v) {
      if (!x || typeof x !== 'object' || Array.isArray(x)) throw new ErroHttp(400, `${campo}: cada item precisa ser um objeto`);
      for (const k of exigir) {
        const y = (x as Record<string, unknown>)[k];
        if (typeof y !== 'string' || !y) throw new ErroHttp(400, `${campo}: cada item precisa de "${k}" (texto)`);
      }
    }
  };
}

export function mapaDeNumeros(v: unknown, campo: string) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ErroHttp(400, `${campo}: esperava objeto {nome: número}`);
  for (const x of Object.values(v)) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new ErroHttp(400, `${campo}: valores precisam ser números`);
  }
}

export const RE_STATUS = /^(aberto|go|nao|feito|opcao:[A-Za-z0-9_.-]{1,64})$/;
export function validarStatus(v: unknown, campo: string) {
  if (typeof v !== 'string' || !RE_STATUS.test(v)) {
    throw new ErroHttp(400, `${campo}: use aberto, go, nao, feito ou opcao:<id>`);
  }
}

export const TIPOS_PENDENTE = ['GO', 'DECISAO', 'COMANDO', 'LOGIN', 'UI'];
export function validarTipo(v: unknown, campo: string) {
  if (typeof v !== 'string' || !TIPOS_PENDENTE.includes(v)) {
    throw new ErroHttp(400, `${campo}: use ${TIPOS_PENDENTE.join(', ')}`);
  }
}
