import { autenticar } from '@/lib/auth';
import { q, seriais, serial } from '@/lib/db';
import { ErroHttp, json, lerJson, objeto, rota } from '@/lib/http';
import { paraTs } from '@/lib/tempo';

export const dynamic = 'force-dynamic';

/**
 * Filtros (todos opcionais): desde=<iso> (criado depois), nao_lidas=1, de=<autor>,
 * pendente_id=<id> (thread do item) ou geral=1 (thread geral, sem pendente), limite=<n até 1000>.
 * Ex. do maestro: /api/mensagens?nao_lidas=1&de=gabriel
 */
export const GET = rota(async (req) => {
  await autenticar(req);
  const u = new URL(req.url).searchParams;
  const onde: string[] = [];
  const ps: unknown[] = [];
  const add = (cond: string, v: unknown) => { ps.push(v); onde.push(cond.replace('?', `$${ps.length}`)); };

  const desde = u.get('desde');
  if (desde) add('criado_em > ?::timestamptz', paraTs(desde, 'desde'));
  if (u.get('nao_lidas') === '1') onde.push('lida_em is null');
  const de = u.get('de');
  if (de) add('de = ?', de);
  const pid = u.get('pendente_id');
  if (pid) add('pendente_id = ?', pid);
  else if (u.get('geral') === '1') onde.push('pendente_id is null');
  const limite = Math.min(1000, Math.max(1, Number(u.get('limite')) || 200));

  const linhas = await q(
    `select * from mensagens ${onde.length ? 'where ' + onde.join(' and ') : ''}
      order by criado_em asc, id asc limit ${limite}`,
    ps,
  );
  return json(seriais(linhas));
});

/** Nova mensagem. Na tela, `de` é sempre "gabriel"; agente precisa dizer quem é (padrão "maestro"). */
export const POST = rota(async (req) => {
  const quem = await autenticar(req);
  const c = objeto(await lerJson(req));
  const texto = typeof c.texto === 'string' ? c.texto.trim() : '';
  if (!texto) throw new ErroHttp(400, 'texto é obrigatório');
  if (texto.length > 4000) throw new ErroHttp(400, 'texto: até 4000 caracteres');

  let de = 'gabriel';
  if (quem.tipo === 'agente') {
    de = typeof c.de === 'string' && c.de.trim() ? c.de.trim().slice(0, 80) : 'maestro';
    if (de.toLowerCase() === 'gabriel') throw new ErroHttp(400, 'agente não escreve como "gabriel"');
  }
  let pendente: string | null = null;
  if (c.pendente_id != null && c.pendente_id !== '') {
    if (typeof c.pendente_id !== 'string') throw new ErroHttp(400, 'pendente_id: texto');
    pendente = c.pendente_id;
  }
  const [m] = await q(
    'insert into mensagens (pendente_id, de, texto) values ($1, $2, $3) returning *',
    [pendente, de, texto],
  );
  return json(serial(m), 201);
});
