import { autenticar } from '@/lib/auth';
import { limparLinha, montarUpsert } from '@/lib/campos';
import { q, serial } from '@/lib/db';
import { FRENTES, exigirId } from '@/lib/esquemas';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ nome: string }> };

/** Upsert da frente: só os campos enviados mudam; null explícito limpa (ex.: "travado": null). */
export const PUT = rota<Ctx>(async (req, { params }) => {
  await autenticar(req);
  const nome = exigirId((await params).nome, 'nome'); // o Next já entrega o segmento decodificado
  const corpo = objeto(await lerJson(req));
  if (corpo.nome != null && corpo.nome !== nome) throw new ErroHttp(400, 'nome do corpo difere do da URL');
  const linha = limparLinha(FRENTES, corpo, ['nome']);
  linha.nome = nome;
  const { texto, params: ps } = montarUpsert('frentes', 'nome', FRENTES, linha, 'atualizado_em');
  const [f] = await q(texto, ps);
  return json(serial(f));
});
