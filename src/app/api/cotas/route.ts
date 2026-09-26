import { autenticar } from '@/lib/auth';
import { ler } from '@/lib/dados';
import { COTAS, comoLista, exigirId } from '@/lib/esquemas';
import { json, lerJson, rota } from '@/lib/http';
import { upsertLote } from '@/lib/lote';

export const dynamic = 'force-dynamic';

export const GET = rota(async (req) => {
  await autenticar(req);
  return json(await ler('cotas'));
});

/** Upsert em lote. id padrão = "<conta>-<balde>"; medido_em padrão = agora. */
export const PUT = rota(async (req) => {
  await autenticar(req);
  const itens = comoLista(await lerJson(req), 100);
  const salvos = await upsertLote('cotas', 'id', COTAS, itens, (linha) => {
    const conta = exigirId(linha.conta, 'conta');
    const balde = exigirId(linha.balde, 'balde');
    linha.id = linha.id == null ? `${conta}-${balde}` : exigirId(linha.id, 'id');
  }, 'medido_em');
  return json(salvos);
});
