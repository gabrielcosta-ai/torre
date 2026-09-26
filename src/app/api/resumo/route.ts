import { autenticar } from '@/lib/auth';
import { resumo } from '@/lib/dados';
import { json, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Tudo que a tela precisa numa chamada (a UI faz polling de 15 s e revalida após cada ação). */
export const GET = rota(async (req) => {
  const quem = await autenticar(req);
  const dados = await resumo();
  return json({ agora: new Date().toISOString(), quem: quem.tipo, ...dados });
});
