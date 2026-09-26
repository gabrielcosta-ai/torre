import { exigirGabriel } from '@/lib/auth';
import { q } from '@/lib/db';
import { json, rota } from '@/lib/http';
import { MINUTOS_CONVITE, hashConvite, novoCodigo } from '@/lib/passkey';

export const dynamic = 'force-dynamic';

/**
 * "Adicionar aparelho": só a sessão do Gabriel (nunca o token de agente) gera o código.
 * 6 dígitos, 10 minutos, uso único; gerar um novo derruba o anterior. Só o hash fica no banco.
 */
export const POST = rota(async (req) => {
  const quem = await exigirGabriel(req);
  const codigo = novoCodigo();
  await q('update convites set usado_em = now() where usado_em is null');
  const [c] = await q<{ expira_em: Date }>(
    `insert into convites (codigo_hash, criado_por, expira_em)
     values ($1, $2, now() + make_interval(mins => $3::int)) returning expira_em`,
    [hashConvite(codigo), quem.passkey, MINUTOS_CONVITE],
  );
  await q("delete from convites where expira_em < now() - interval '7 days'");
  return json({ codigo, expira_em: new Date(c.expira_em).toISOString(), minutos: MINUTOS_CONVITE });
});
