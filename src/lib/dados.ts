import { type Linha, seriais, serial, sql } from './db';

/** Consultas de leitura usadas pelas rotas GET e pelo /api/resumo (uma ida ao banco só). */
export const LEITURAS = {
  pendentes: {
    texto:
      `(select * from pendentes where status = 'aberto')
       union all
       (select * from pendentes where status <> 'aberto'
         order by coalesce(respondido_em, criado_em) desc limit 200)
       order by criado_em desc`,
    params: [] as unknown[],
  },
  frentes: { texto: 'select * from frentes order by nome limit 200', params: [] as unknown[] },
  custo: { texto: 'select * from custo order by usd_estimado desc limit 300', params: [] as unknown[] },
  // Sessões da janela de 7 dias (o coletor manda só a janela; as velhas ficam no banco sem poluir a tela).
  sessoes: {
    texto:
      `select * from sessoes
        where ultimo_turno is null or ultimo_turno > now() - interval '7 days'
        order by tokens_out desc limit 300`,
    params: [] as unknown[],
  },
  cotas: { texto: 'select * from cotas order by conta, balde limit 100', params: [] as unknown[] },
  memoria: { texto: "select * from memoria where id = 'atual'", params: [] as unknown[] },
  // Conversa dos últimos 60 dias + tudo que não foi lido, em ordem de chegada.
  mensagens: {
    texto:
      `select * from (
         select * from mensagens
          where criado_em > now() - interval '60 days' or lida_em is null
          order by criado_em desc limit 2000
       ) m order by criado_em asc, id asc`,
    params: [] as unknown[],
  },
};

export type NomeLeitura = keyof typeof LEITURAS;

export async function ler(nome: NomeLeitura): Promise<Linha[]> {
  const l = LEITURAS[nome];
  return seriais((await sql().query(l.texto, l.params)) as Linha[]);
}

export async function resumo() {
  const s = sql();
  const nomes = Object.keys(LEITURAS) as NomeLeitura[];
  const res = (await s.transaction(
    nomes.map((n) => s.query(LEITURAS[n].texto, LEITURAS[n].params)),
    { readOnly: true },
  )) as Linha[][];
  const out: Record<string, unknown> = {};
  nomes.forEach((n, i) => {
    out[n] = n === 'memoria' ? (res[i][0] ? serial(res[i][0]) : null) : seriais(res[i]);
  });
  return out;
}
