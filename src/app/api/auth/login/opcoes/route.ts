import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { hostTorre } from '@/lib/env';
import { rota } from '@/lib/http';
import { comCookies } from '@/lib/passkey';
import { cookieDesafio } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Opções de login com passkey descobrível (o aparelho oferece a chave dele; sem lista de ids). */
export const GET = rota(async () => {
  const { rpID } = hostTorre();
  const opcoes = await generateAuthenticationOptions({ rpID, userVerification: 'required' });
  return comCookies(opcoes, [await cookieDesafio({ t: 'login', d: opcoes.challenge })]);
});
