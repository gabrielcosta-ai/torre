import { rota } from '@/lib/http';
import { comCookies } from '@/lib/passkey';
import { cookieSessaoApagada } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Apaga o cookie deste aparelho (a passkey continua cadastrada). */
export const POST = rota(async () => comCookies({ ok: true }, [cookieSessaoApagada()]));
