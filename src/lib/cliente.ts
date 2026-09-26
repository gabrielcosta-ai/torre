/** Chamada à API a partir da tela: devolve o JSON ou lança Error com a mensagem {erro} do servidor. */
export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

export async function api<T = unknown>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(caminho, {
      method: metodo,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(0, 'sem conexão');
  }
  let dados: unknown = null;
  try {
    dados = await r.json();
  } catch {
    dados = null;
  }
  if (r.status === 401 && typeof window !== 'undefined' && !caminho.startsWith('/api/auth/')) {
    window.location.assign('/entrar');
  }
  if (!r.ok) {
    const msg = dados && typeof dados === 'object' && 'erro' in dados ? String((dados as { erro: unknown }).erro) : `erro ${r.status}`;
    throw new ErroApi(r.status, msg);
  }
  return dados as T;
}
