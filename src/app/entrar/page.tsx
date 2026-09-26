import type { Metadata } from 'next';
import Entrar from '@/components/Entrar';

export const metadata: Metadata = { title: 'Entrar · Torre' };

export default function PaginaEntrar() {
  return <Entrar />;
}
