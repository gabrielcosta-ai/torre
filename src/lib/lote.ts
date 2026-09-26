import { limparLinha, montarUpsert, type Esquema } from './campos';
import { type Linha, seriais, sql } from './db';

/** Upsert em lote numa transação só (tudo ou nada). */
export async function upsertLote(
  tabela: string,
  pk: string,
  esq: Esquema,
  itens: Record<string, unknown>[],
  prepara: (linha: Record<string, unknown>, bruto: Record<string, unknown>) => void,
  agora?: string,
): Promise<Linha[]> {
  const s = sql();
  const consultas = itens.map((bruto) => {
    const linha = limparLinha(esq, bruto);
    prepara(linha, bruto);
    const { texto, params } = montarUpsert(tabela, pk, esq, linha, agora);
    return s.query(texto, params);
  });
  const res = (await s.transaction(consultas)) as Linha[][];
  return seriais(res.map((r) => r[0]));
}
