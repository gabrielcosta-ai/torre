-- Torre v2: esquema idempotente (rode quantas vezes quiser: npm run db:migrate).
-- Datas em timestamptz. A API aceita ISO com fuso ou sem fuso (hora local de TORRE_TZ).
-- Cada comando termina em ";" no fim da linha (o migrate.mjs separa por aí).

create table if not exists pendentes (
  id            text primary key,
  titulo        text not null,
  tipo          text not null default 'GO' check (tipo in ('GO','DECISAO','COMANDO','LOGIN','UI')),
  frente        text,
  quem_pediu    text,
  destrava      text,
  comandos      jsonb not null default '[]'::jsonb,
  opcoes        jsonb not null default '[]'::jsonb,
  criado_em     timestamptz not null default now(),
  status        text not null default 'aberto' check (status in ('aberto','go','nao','feito') or status like 'opcao:%'),
  resposta      text,
  respondido_em timestamptz
);
create index if not exists pendentes_criado_em on pendentes (criado_em desc);
create index if not exists pendentes_status on pendentes (status);

create table if not exists frentes (
  nome          text primary key,
  operador      text,
  modelo        text,
  marco_atual   text,
  proximo_marco text,
  travado       text,
  risco         text,
  recrutas      jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);

create table if not exists custo (
  id            text primary key,
  frente        text not null,
  periodo       text not null,
  tokens_in     bigint not null default 0,
  tokens_out    bigint not null default 0,
  cache_read    bigint not null default 0,
  usd_estimado  numeric(14,4) not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists sessoes (
  sessao_id     text primary key,
  conta         text,
  projeto       text,
  modelo        text,
  papel         text,
  tokens_out    bigint not null default 0,
  cache_read    bigint not null default 0,
  cache_create  bigint not null default 0,
  tokens_in     bigint not null default 0,
  turnos        integer not null default 0,
  ultimo_turno  timestamptz,
  alerta        boolean not null default false,
  atualizado_em timestamptz not null default now()
);
create index if not exists sessoes_ultimo_turno on sessoes (ultimo_turno desc);

create table if not exists cotas (
  id        text primary key,
  conta     text not null,
  balde     text not null,
  usado_pct numeric(6,2),
  renova_em timestamptz,
  medido_em timestamptz not null default now()
);

create table if not exists memoria (
  id                     text primary key default 'atual' check (id = 'atual'),
  fatos_total            integer not null default 0,
  fatos_quebrados        integer not null default 0,
  por_projeto            jsonb not null default '{}'::jsonb,
  ultimos                jsonb not null default '[]'::jsonb,
  gotchas_7d_por_projeto jsonb not null default '{}'::jsonb,
  medido_em              timestamptz not null default now()
);

create table if not exists mensagens (
  id          serial primary key,
  pendente_id text references pendentes(id) on delete cascade,
  de          text not null,
  texto       text not null,
  criado_em   timestamptz not null default now(),
  lida_em     timestamptz
);
create index if not exists mensagens_pendente on mensagens (pendente_id, criado_em);
create index if not exists mensagens_nao_lidas on mensagens (criado_em) where lida_em is null;

-- Uma passkey por aparelho (celular, PC...). id = credential id em base64url.
create table if not exists passkeys (
  id          text primary key,
  public_key  text not null,
  counter     bigint not null default 0,
  transports  jsonb not null default '[]'::jsonb,
  aparelho    text not null,
  criado_em   timestamptz not null default now(),
  ultimo_uso  timestamptz
);

-- Convite de aparelho novo: código de 6 dígitos (guardado só o hash), 10 min, uso único.
create table if not exists convites (
  id          serial primary key,
  codigo_hash text not null,
  criado_por  text,
  criado_em   timestamptz not null default now(),
  expira_em   timestamptz not null,
  usado_em    timestamptz,
  tentativas  integer not null default 0
);

create table if not exists config (
  chave text primary key,
  valor text not null
);
insert into config (chave, valor) values ('setup_usado', 'false') on conflict (chave) do nothing;
