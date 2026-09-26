import { autenticar } from '@/lib/auth';
import { ler } from '@/lib/dados';
import { SESSOES, comoLista, exigirId } from '@/lib/esquemas';
import { json, lerJson, rota } from '@/lib/http';
import { upsertLote } from '@/lib/lote';

export const dynamic = 'force-dynamic';

/** Sessões com turno nos últimos 7 dias, por tokens de saída. */
export const GET = rota(async (req) => {
  await autenticar(req);
  return json(await ler('sessoes'));
});

/** Upsert em lote (lista do coletor). Chave: sessao_id. */
export const PUT = rota(async (req) => {
  await autenticar(req);
  const itens = comoLista(await lerJson(req), 1000);
  const salvos = await upsertLote('sessoes', 'sessao_id', SESSOES, itens, (linha) => {
    linha.sessao_id = exigirId(linha.sessao_id, 'sessao_id');
  }, 'atualizado_em');
  return json({ ok: true, gravadas: salvos.length });
});
