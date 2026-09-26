import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Entrar from '@/components/Entrar';
import { COOKIE_SESSAO, lerSessao } from '@/lib/sessao';

export const metadata: Metadata = { title: 'Entrar · Torre' };
export const dynamic = 'force-dynamic';

/** Público. Quem já tem sessão válida vai direto para o painel. */
export default async function PaginaEntrar() {
  let logado = false;
  try {
    logado = !!(await lerSessao((await cookies()).get(COOKIE_SESSAO)?.value));
  } catch {
    logado = false; // env de sessão ausente: mostra a tela (a API explica o erro)
  }
  if (logado) redirect('/');
  return <Entrar />;
}
