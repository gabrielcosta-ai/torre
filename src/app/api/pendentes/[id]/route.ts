import { autenticar } from '@/lib/auth';
import { limparLinha, montarUpdate } from '@/lib/campos';
import { q, serial } from '@/lib/db';
import { PENDENTES, PENDENTES_UI } from '@/lib/esquemas';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota<Ctx>(async (req, { params }) => {
  await autenticar(req);
  const { id } = await params;
  const [p] = await q('select * from pendentes where id = $1', [id]);
  if (!p) throw new ErroHttp(404, 'pendente não encontrado');
  return json(serial(p));
});

/**
 * Tela: só status, resposta e respondido_em. Agente: qualquer campo (menos id).
 * Status fechado sem respondido_em carimba agora; reabrir limpa respondido_em.
 */
export const PATCH = rota<Ctx>(async (req, { params }) => {
  const quem = await autenticar(req);
  const { id } = await params;
  const corpo = objeto(await lerJson(req));
  if ('id' in corpo) throw new ErroHttp(400, 'id não muda');
  if (quem.tipo === 'gabriel') {
    const proibido = Object.keys(corpo).find((k) => !PENDENTES_UI.includes(k));
    if (proibido) throw new ErroHttp(400, `a tela só muda ${PENDENTES_UI.join(', ')} (veio ${proibido})`);
  }
  const linha = limparLinha(PENDENTES, corpo);
  if (!Object.keys(linha).length) throw new ErroHttp(400, 'nada para mudar');

  const [atual] = await q<{ opcoes: unknown }>('select opcoes from pendentes where id = $1', [id]);
  if (!atual) throw new ErroHttp(404, 'pendente não encontrado');

  if (typeof linha.status === 'string') {
    if (linha.status.startsWith('opcao:')) {
      const oid = linha.status.slice(6);
      const opcoes = typeof linha.opcoes === 'string' ? JSON.parse(linha.opcoes) : atual.opcoes;
      const existe = Array.isArray(opcoes) && opcoes.some((o) => o && String((o as { id?: unknown }).id) === oid);
      if (!existe) throw new ErroHttp(400, `opção inexistente: ${oid}`);
    }
    if (!('respondido_em' in linha)) {
      linha.respondido_em = linha.status === 'aberto' ? null : new Date().toISOString();
    }
  }

  const { texto, params: ps } = montarUpdate('pendentes', 'id', PENDENTES, id, linha);
  const [p] = await q(texto, ps);
  if (!p) throw new ErroHttp(404, 'pendente não encontrado');
  return json(serial(p));
});
