import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Público: só diz que o app está de pé (não toca o banco nem revela configuração). */
export async function GET() {
  return json({ ok: true });
}
