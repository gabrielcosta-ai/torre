import { randomBytes } from 'node:crypto';
import { autenticar } from '@/lib/auth';
import { limparLinha } from '@/lib/campos';
import { ler } from '@/lib/dados';
import { q, serial } from '@/lib/db';
import { PENDENTES, exigirId } from '@/lib/esquemas';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Abertos + os 200 fechados mais recentes. */
export const GET = rota(async (req) => {
  await autenticar(req);
  return json(await ler('pendentes'));
});

/** Nova pendência. `id` opcional (o agente pode escolher); repetido = 409. */
export const POST = rota(async (req) => {
  await autenticar(req);
  const corpo = objeto(await lerJson(req));
  const linha = limparLinha(PENDENTES, corpo);
  linha.id = corpo.id == null ? `p-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}` : exigirId(corpo.id, 'id');
  if (typeof linha.titulo !== 'string' || !linha.titulo.trim()) throw new ErroHttp(400, 'titulo é obrigatório');
  if (!linha.tipo) linha.tipo = 'GO';
  if (!linha.status) linha.status = 'aberto';

  const cols = Object.keys(linha);
  const casts: Record<string, string> = { comandos: 'jsonb', opcoes: 'jsonb', criado_em: 'timestamptz', respondido_em: 'timestamptz' };
  const valores = cols.map((k, i) => `$${i + 1}::${casts[k] || 'text'}`);
  const [nova] = await q(
    `insert into pendentes (${cols.join(', ')}) values (${valores.join(', ')}) returning *`,
    cols.map((k) => linha[k]),
  );
  return json(serial(nova), 201);
});
