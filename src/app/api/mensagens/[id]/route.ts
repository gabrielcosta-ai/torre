import { autenticar } from '@/lib/auth';
import { q, serial } from '@/lib/db';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';
import { paraTs } from '@/lib/tempo';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Marca como lida: {} ou {"lida_em": "<iso>"} (agora por padrão); {"lida_em": null} desmarca. */
export const PATCH = rota<Ctx>(async (req, { params }) => {
  await autenticar(req);
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) throw new ErroHttp(404, 'mensagem não encontrada');
  const c = objeto(await lerJson(req));
  const extra = Object.keys(c).find((k) => k !== 'lida_em');
  if (extra) throw new ErroHttp(400, `campo desconhecido: ${extra}`);
  const lida = 'lida_em' in c ? paraTs(c.lida_em, 'lida_em') : new Date().toISOString();
  const [m] = await q('update mensagens set lida_em = $1::timestamptz where id = $2 returning *', [lida, Number(id)]);
  if (!m) throw new ErroHttp(404, 'mensagem não encontrada');
  return json(serial(m));
});
