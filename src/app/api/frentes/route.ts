import { autenticar } from '@/lib/auth';
import { ler } from '@/lib/dados';
import { json, rota } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = rota(async (req) => {
  await autenticar(req);
  return json(await ler('frentes'));
});
