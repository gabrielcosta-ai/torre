import {
  type Esquema, listaDeObjetos, listaDeTextos, mapaDeNumeros, validarStatus, validarTipo,
} from './campos';
import { ErroHttp } from './http';

export const PENDENTES: Esquema = {
  id: { tipo: 'texto' },
  titulo: { tipo: 'texto' },
  tipo: { tipo: 'texto', validar: validarTipo },
  frente: { tipo: 'texto' },
  quem_pediu: { tipo: 'texto' },
  destrava: { tipo: 'texto' },
  comandos: { tipo: 'json', validar: listaDeTextos(50) },
  opcoes: { tipo: 'json', validar: listaDeObjetos(20, ['id']) },
  criado_em: { tipo: 'ts' },
  status: { tipo: 'texto', validar: validarStatus },
  resposta: { tipo: 'texto' },
  respondido_em: { tipo: 'ts' },
};
/** O que a tela (sessão do Gabriel) pode mudar num pendente. */
export const PENDENTES_UI = ['status', 'resposta', 'respondido_em'];

export const FRENTES: Esquema = {
  nome: { tipo: 'texto' },
  operador: { tipo: 'texto' },
  modelo: { tipo: 'texto' },
  marco_atual: { tipo: 'texto' },
  proximo_marco: { tipo: 'texto' },
  travado: { tipo: 'texto' },
  risco: { tipo: 'texto' },
  recrutas: { tipo: 'json', validar: listaDeObjetos(50, ['nome']) },
  atualizado_em: { tipo: 'ts' },
};

export const CUSTO: Esquema = {
  id: { tipo: 'texto' },
  frente: { tipo: 'texto' },
  periodo: { tipo: 'texto' },
  tokens_in: { tipo: 'int' },
  tokens_out: { tipo: 'int' },
  cache_read: { tipo: 'int' },
  usd_estimado: { tipo: 'num' },
  atualizado_em: { tipo: 'ts' },
};

export const SESSOES: Esquema = {
  sessao_id: { tipo: 'texto' },
  conta: { tipo: 'texto' },
  projeto: { tipo: 'texto' },
  modelo: { tipo: 'texto' },
  papel: { tipo: 'texto' },
  tokens_out: { tipo: 'int' },
  cache_read: { tipo: 'int' },
  cache_create: { tipo: 'int' },
  tokens_in: { tipo: 'int' },
  turnos: { tipo: 'int' },
  ultimo_turno: { tipo: 'ts' },
  alerta: { tipo: 'bool' },
  atualizado_em: { tipo: 'ts' },
};

export const COTAS: Esquema = {
  id: { tipo: 'texto' },
  conta: { tipo: 'texto' },
  balde: { tipo: 'texto' },
  usado_pct: { tipo: 'num' },
  renova_em: { tipo: 'ts' },
  medido_em: { tipo: 'ts' },
};

export const MEMORIA: Esquema = {
  id: { tipo: 'texto' },
  fatos_total: { tipo: 'int' },
  fatos_quebrados: { tipo: 'int' },
  por_projeto: { tipo: 'json', validar: mapaDeNumeros },
  ultimos: { tipo: 'json', validar: listaDeObjetos(50) },
  gotchas_7d_por_projeto: { tipo: 'json', validar: mapaDeNumeros },
  medido_em: { tipo: 'ts' },
};

/** Texto de id obrigatório e razoável (usado em chaves primárias escolhidas pelo agente). */
export function exigirId(v: unknown, campo: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ErroHttp(400, `${campo} é obrigatório (texto)`);
  const s = v.trim();
  if (s.length > 200) throw new ErroHttp(400, `${campo}: até 200 caracteres`);
  return s;
}

/** Corpo de PUT em lote: aceita array ou objeto único; limite por chamada. */
export function comoLista(v: unknown, max = 1000): Record<string, unknown>[] {
  const lista = Array.isArray(v) ? v : [v];
  if (!lista.length) throw new ErroHttp(400, 'lista vazia');
  if (lista.length > max) throw new ErroHttp(400, `no máximo ${max} itens por chamada`);
  for (const x of lista) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) throw new ErroHttp(400, 'cada item precisa ser um objeto JSON');
  }
  return lista as Record<string, unknown>[];
}
