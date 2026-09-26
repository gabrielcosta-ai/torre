import { autenticar } from '@/lib/auth';
import { limparLinha, montarUpsert } from '@/lib/campos';
import { q, serial } from '@/lib/db';
import { MEMORIA } from '@/lib/esquemas';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = rota(async (req) => {
  await autenticar(req);
  const [m] = await q("select * from memoria where id = 'atual'");
  return json(m ? serial(m) : null);
});

/** Upsert do documento único 'atual' (formato do coletor). */
export const PUT = rota(async (req) => {
  await autenticar(req);
  const corpo = objeto(await lerJson(req));
  if (corpo.id != null && corpo.id !== 'atual') throw new ErroHttp(400, "memoria só tem o id 'atual'");
  const linha = limparLinha(MEMORIA, corpo, ['id']);
  linha.id = 'atual';
  const { texto, params } = montarUpsert('memoria', 'id', MEMORIA, linha, 'medido_em');
  const [m] = await q(texto, params);
  return json(serial(m));
});
