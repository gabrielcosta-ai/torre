import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Torre from '@/components/Torre';
import { COOKIE_SESSAO, lerSessao } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Painel. Sem sessão válida vai para /entrar; os dados vêm de /api/resumo (que revalida a passkey). */
export default async function Pagina() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const sessao = await lerSessao(token);
  if (!sessao) redirect('/entrar');
  return <Torre />;
}
