import { autenticar } from '@/lib/auth';
import { ler } from '@/lib/dados';
import { CUSTO, comoLista, exigirId } from '@/lib/esquemas';
import { json, lerJson, rota } from '@/lib/http';
import { upsertLote } from '@/lib/lote';

export const dynamic = 'force-dynamic';

export const GET = rota(async (req) => {
  await autenticar(req);
  return json(await ler('custo'));
});

/** Upsert de custo (objeto ou lista). id padrão = "<frente>:<periodo>". */
export const PUT = rota(async (req) => {
  await autenticar(req);
  const corpo = await lerJson(req);
  const itens = comoLista(corpo, 500);
  const salvos = await upsertLote('custo', 'id', CUSTO, itens, (linha) => {
    const frente = exigirId(linha.frente, 'frente');
    const periodo = exigirId(linha.periodo, 'periodo');
    linha.id = linha.id == null ? `${frente}:${periodo}` : exigirId(linha.id, 'id');
  }, 'atualizado_em');
  return json(Array.isArray(corpo) ? salvos : salvos[0]);
});
