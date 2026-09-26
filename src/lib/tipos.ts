/** Formas que a API devolve (datas em ISO UTC; a tela formata na hora local do aparelho). */

export type Opcao = { id: string; texto?: string; justificativa?: string };

export type Pendente = {
  id: string;
  titulo: string;
  tipo: string;
  frente: string | null;
  quem_pediu: string | null;
  destrava: string | null;
  comandos: unknown;
  opcoes: unknown;
  criado_em: string | null;
  status: string;
  resposta: string | null;
  respondido_em: string | null;
};

export type Recruta = { nome?: string; modelo?: string; effort?: string };

export type Frente = {
  nome: string;
  operador: string | null;
  modelo: string | null;
  marco_atual: string | null;
  proximo_marco: string | null;
  travado: string | null;
  risco: string | null;
  recrutas: unknown;
  atualizado_em: string | null;
};

export type Custo = {
  id: string;
  frente: string;
  periodo: string;
  tokens_in: number;
  tokens_out: number;
  cache_read: number;
  usd_estimado: number;
  atualizado_em: string | null;
};

export type Sessao = {
  sessao_id: string;
  conta: string | null;
  projeto: string | null;
  modelo: string | null;
  papel: string | null;
  tokens_out: number;
  cache_read: number;
  cache_create: number;
  tokens_in: number;
  turnos: number;
  ultimo_turno: string | null;
  alerta: boolean;
  atualizado_em: string | null;
};

export type Cota = {
  id: string;
  conta: string;
  balde: string;
  usado_pct: number | null;
  renova_em: string | null;
  medido_em: string | null;
};

export type FatoRecente = { name?: string; description?: string; modified?: string };

export type Memoria = {
  fatos_total: number;
  fatos_quebrados: number;
  por_projeto: Record<string, number> | null;
  ultimos: FatoRecente[] | null;
  gotchas_7d_por_projeto: Record<string, number> | null;
  medido_em: string | null;
};

export type Mensagem = {
  id: number;
  pendente_id: string | null;
  de: string;
  texto: string;
  criado_em: string;
  lida_em: string | null;
};

export type Resumo = {
  agora: string;
  quem: 'gabriel' | 'agente';
  pendentes: Pendente[];
  frentes: Frente[];
  custo: Custo[];
  sessoes: Sessao[];
  cotas: Cota[];
  memoria: Memoria | null;
  mensagens: Mensagem[];
};
