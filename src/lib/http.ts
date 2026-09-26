import { NextResponse } from 'next/server';

/** Erro com status HTTP; a mensagem vai ao cliente como {erro}. */
export class ErroHttp extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

/** Env obrigatória ausente ou inválida: vira 500 com o nome da env (nunca o valor). */
export class ErroConfig extends Error {
  constructor(public env: string, detalhe = 'ausente') {
    super(`configuração ${detalhe}: ${env}`);
  }
}

export function json(dados: unknown, status = 200, init?: { headers?: Record<string, string> }) {
  return NextResponse.json(dados, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(init?.headers || {}) },
  });
}

export function erro(status: number, mensagem: string) {
  return json({ erro: mensagem }, status);
}

/** Códigos do Postgres que são culpa da entrada, não do servidor. */
const PG_ENTRADA: Record<string, [number, string]> = {
  '23505': [409, 'já existe um registro com esse id'],
  '23503': [404, 'referência inexistente (pendente_id?)'],
  '23502': [400, 'campo obrigatório vazio'],
  '23514': [400, 'valor fora do permitido'],
  '22P02': [400, 'valor com formato inválido'],
  '22007': [400, 'data inválida'],
  '22008': [400, 'data fora do intervalo'],
  '22003': [400, 'número fora do intervalo'],
  '22001': [400, 'texto longo demais'],
};

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Envolve o handler: ErroHttp e erros de entrada do Postgres viram {erro} com o status certo. */
export function rota<C = unknown>(h: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await h(req, ctx);
    } catch (e) {
      if (e instanceof ErroHttp) return erro(e.status, e.message);
      if (e instanceof ErroConfig) {
        console.error('[torre]', e.message);
        return erro(500, e.message);
      }
      const code = (e as { code?: string })?.code;
      if (code && PG_ENTRADA[code]) {
        const [st, msg] = PG_ENTRADA[code];
        return erro(st, msg);
      }
      console.error('[torre] erro interno', e);
      return erro(500, 'erro interno');
    }
  };
}

/** Lê o corpo JSON; 400 se vier vazio ou inválido. */
export async function lerJson(req: Request): Promise<unknown> {
  const tipo = req.headers.get('content-type') || '';
  if (!tipo.toLowerCase().includes('application/json')) {
    throw new ErroHttp(400, 'mande Content-Type: application/json');
  }
  const texto = await req.text();
  if (texto.length > 2_000_000) throw new ErroHttp(400, 'corpo grande demais');
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroHttp(400, 'JSON inválido');
  }
}

export function objeto(v: unknown, oque = 'corpo'): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ErroHttp(400, `${oque} precisa ser um objeto JSON`);
  return v as Record<string, unknown>;
}
