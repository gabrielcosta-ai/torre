'use client';

import { useEffect, useRef, useState } from 'react';
import Conversa, { naoLidas } from './Conversa';
import { api } from '@/lib/cliente';
import { cmp, fmtIdade, fmtQuando, NF, str } from '@/lib/formato';
import type { Mensagem, Opcao, Pendente } from '@/lib/tipos';

export function estaAberto(p: Pendente) {
  return !p.status || p.status === 'aberto';
}

function opcoesDe(p: Pendente): Opcao[] {
  return Array.isArray(p.opcoes) ? (p.opcoes as Opcao[]).filter((o) => o && str(o.id)) : [];
}

export function rotuloStatus(p: Pendente): string {
  const s = str(p.status);
  if (s === 'go') return 'GO';
  if (s === 'nao') return 'Não';
  if (s === 'feito') return 'Feito';
  if (s.startsWith('opcao:')) {
    const oid = s.slice(6);
    const o = opcoesDe(p).find((x) => str(x.id) === oid);
    return 'Opção: ' + (o && o.texto ? str(o.texto) : oid);
  }
  return s || 'aberto';
}

/** Erros de gravação guardados fora do cartão: sobrevivem se o cartão for recriado ou mudar de lista. */
export type ErrosGrav = {
  de: (id: string) => string | undefined;
  marcar: (id: string, msg: string) => void;
  limpar: (id: string) => void;
};

const MSG_ERRO = 'não salvou, tente de novo';

function BlocoCmd({ texto, i, total }: { texto: string; i: number; total: number }) {
  const pre = useRef<HTMLPreElement>(null);
  const [rot, setRot] = useState('Copiar');
  function volta() { setTimeout(() => setRot('Copiar'), 1600); }
  function selecionar() {
    try {
      const r = document.createRange();
      if (pre.current) r.selectNodeContents(pre.current);
      const s = window.getSelection();
      s?.removeAllRanges(); s?.addRange(r);
    } catch { /* sem seleção */ }
    setRot('Selecionado'); volta();
  }
  function copiar() {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(texto).then(() => { setRot('Copiado'); volta(); }).catch(selecionar);
      } else selecionar();
    } catch { selecionar(); }
  }
  return (
    <div className="cmd">
      <div className="cmd-barra">
        <span>{total > 1 ? `comando ${i + 1} de ${total}` : 'comando'}</span>
        <button type="button" className="btn btn-mini" onClick={copiar}>{rot}</button>
      </div>
      <pre ref={pre}>{texto}</pre>
    </div>
  );
}

function CartaoPendente({
  p, msgs, agora, erros, recarregar,
}: {
  p: Pendente; msgs: Mensagem[]; agora: number; erros: ErrosGrav; recarregar: () => void;
}) {
  const [nota, setNota] = useState(str(p.resposta));
  const [suja, setSuja] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: '' | 'ok' | 'erro' } | null>(null);
  const nNovas = naoLidas(msgs).length;
  const [conversa, setConversa] = useState(nNovas > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nota vinda do servidor só entra se o Gabriel não estiver digitando.
  useEffect(() => {
    if (!suja && document.activeElement !== inputRef.current) setNota(str(p.resposta));
  }, [p.resposta, suja]);
  // Mensagem nova do maestro abre a conversa do item.
  useEffect(() => {
    if (nNovas > 0) setConversa(true);
  }, [nNovas]);

  const tipo = str(p.tipo).toUpperCase();
  const erro = erros.de(p.id);
  const avisoVisivel = erro ? { texto: erro, tipo: 'erro' as const } : aviso;

  async function gravar(patch: Record<string, string>) {
    if (ocupado) return;
    const mudou = Object.keys(patch).some((k) => str((p as unknown as Record<string, unknown>)[k]) !== patch[k]);
    if (!mudou) { setAviso({ texto: 'Nada mudou.', tipo: '' }); return; }
    setOcupado(true);
    erros.limpar(p.id);
    setAviso({ texto: 'salvando…', tipo: '' });
    try {
      await api('PATCH', `/api/pendentes/${encodeURIComponent(p.id)}`, patch);
      if ('resposta' in patch) setSuja(false);
      setAviso({ texto: 'Salvo.', tipo: 'ok' });
      recarregar();
    } catch (e) {
      setAviso(null);
      erros.marcar(p.id, `${MSG_ERRO} (${(e as Error).message})`);
    } finally {
      setOcupado(false);
    }
  }

  function responder(status: string) {
    const patch: Record<string, string> = { status };
    const n = nota.trim();
    if (n && n !== str(p.resposta)) patch.resposta = n; // um PATCH por clique leva a nota junto
    gravar(patch);
  }

  function salvarNota() {
    const v = nota.trim();
    if (v === str(p.resposta)) { setAviso({ texto: 'Nota já está salva.', tipo: '' }); return; }
    gravar({ resposta: v });
  }

  const cmds = Array.isArray(p.comandos) ? (p.comandos as unknown[]).filter((c) => c != null && str(c).trim()).map(str) : [];
  const opcoes = opcoesDe(p);
  const decisao = tipo === 'DECISAO' && opcoes.length > 0;
  const idNota = `nota-${p.id}`;

  return (
    <article className="pend" data-id={p.id}>
      <div className="pend-topo">
        <span className="pill pill-tipo" data-tipo={tipo}>{tipo === 'DECISAO' ? 'DECISÃO' : tipo || '—'}</span>
        <h3 className="pend-titulo">{str(p.titulo) || p.id}</h3>
      </div>
      {(p.frente || p.quem_pediu || p.criado_em) && (
        <p className="pend-meta">
          {p.frente && <span><strong>{p.frente}</strong></span>}
          {p.quem_pediu && <span>pediu: {p.quem_pediu}</span>}
          {p.criado_em && <span className="n">aberto {fmtQuando(p.criado_em, agora)} · {fmtIdade(p.criado_em, agora)}</span>}
        </p>
      )}
      {p.destrava && (
        <p className="pend-destrava"><span className="rot">destrava</span>{p.destrava}</p>
      )}
      {cmds.length > 0 && (
        <div className="pend-cmds">
          {cmds.map((c, i) => <BlocoCmd key={i} texto={c} i={i} total={cmds.length} />)}
        </div>
      )}
      <div className={'pend-acoes' + (decisao ? ' decisao' : '')} role="group" aria-label="Responder">
        {decisao ? (
          <>
            {opcoes.map((o) => (
              <button key={o.id} type="button" className="btn btn-opcao" disabled={ocupado} onClick={() => responder('opcao:' + o.id)}>
                <span className="op-texto">{str(o.texto) || o.id}</span>
                {o.justificativa && <span className="op-just">{o.justificativa}</span>}
              </button>
            ))}
            <button type="button" className="btn btn-nao" disabled={ocupado} onClick={() => responder('nao')}>Não</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-go" disabled={ocupado} onClick={() => responder('go')}>GO</button>
            <button type="button" className="btn" disabled={ocupado} onClick={() => responder('feito')}>Feito</button>
            <button type="button" className="btn btn-nao" disabled={ocupado} onClick={() => responder('nao')}>Não</button>
          </>
        )}
      </div>
      <div className="pend-nota">
        <label htmlFor={idNota} className="sr">Nota</label>
        <input
          ref={inputRef} id={idNota} type="text" className="nota-in" maxLength={500} autoComplete="off"
          placeholder="nota curta para quem pediu" value={nota}
          onChange={(e) => { setNota(e.target.value); setSuja(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); salvarNota(); } }}
        />
        <button type="button" className="btn" disabled={ocupado} onClick={salvarNota}>Salvar nota</button>
      </div>
      {p.resposta && <p className="pend-resp">nota salva: {p.resposta}</p>}
      <div className="pend-pe">
        <button
          type="button" className="btn btn-fantasma" aria-expanded={conversa}
          onClick={() => setConversa((v) => !v)}
        >
          {conversa ? 'Fechar conversa' : msgs.length ? 'Conversa' : 'Pedir explicação'}
          {nNovas > 0 && <span className="pill pill-quente pill-conta">{NF.format(nNovas)} nova{nNovas > 1 ? 's' : ''}</span>}
        </button>
        {!conversa && msgs.length > 0 && <span className="dica">{NF.format(msgs.length)} mensage{msgs.length > 1 ? 'ns' : 'm'}</span>}
      </div>
      {conversa && (
        <Conversa
          mensagens={msgs} pendenteId={p.id} agora={agora} aoMudar={recarregar}
          idCampo={`msg-${p.id}`} placeholder="O que você quer entender sobre este pedido?"
        />
      )}
      {avisoVisivel && (
        <p className={`pend-aviso ${avisoVisivel.tipo}`} role="status" aria-live="polite">{avisoVisivel.texto}</p>
      )}
    </article>
  );
}

function ItemFechado({
  p, agora, erros, recarregar,
}: { p: Pendente; agora: number; erros: ErrosGrav; recarregar: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const erro = erros.de(p.id);

  async function reabrir() {
    if (ocupado) return;
    setOcupado(true);
    erros.limpar(p.id);
    try {
      await api('PATCH', `/api/pendentes/${encodeURIComponent(p.id)}`, { status: 'aberto' });
      recarregar();
    } catch (e) {
      erros.marcar(p.id, `${MSG_ERRO} (${(e as Error).message})`);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <li className="fech">
      <div className="fech-topo">
        <span className="pill pill-status">{rotuloStatus(p)}</span>
        <span className="fech-titulo">{str(p.titulo) || p.id}</span>
      </div>
      <div className="fech-pe">
        {p.resposta && <span className="fech-resp">nota: {p.resposta}</span>}
        <span className="n">respondido {fmtQuando(p.respondido_em, agora)}</span>
        <button type="button" className="btn btn-mini" disabled={ocupado} onClick={reabrir}>Reabrir</button>
      </div>
      {erro && <span className="pend-aviso erro" role="status">{erro}</span>}
    </li>
  );
}

const MAX_FECHADOS = 50;

export default function Pendentes({
  pendentes, mensagens, agora, carregou, erroLeitura, erros, recarregar,
}: {
  pendentes: Pendente[];
  mensagens: Mensagem[];
  agora: number;
  carregou: boolean;
  erroLeitura: string | null;
  erros: ErrosGrav;
  recarregar: () => void;
}) {
  const abertos = pendentes.filter(estaAberto)
    .sort((a, b) => cmp(a.criado_em, b.criado_em) || cmp(a.id, b.id)); // mais antigos em cima
  const fechados = pendentes.filter((p) => !estaAberto(p))
    .sort((a, b) => cmp(b.respondido_em || b.criado_em, a.respondido_em || a.criado_em));

  const porItem = new Map<string, Mensagem[]>();
  for (const m of mensagens) {
    if (!m.pendente_id) continue;
    const l = porItem.get(m.pendente_id) || [];
    l.push(m);
    porItem.set(m.pendente_id, l);
  }

  let estado: { texto: string; erro: boolean } | null = null;
  if (!carregou) estado = erroLeitura ? { texto: `Não consegui ler os dados (${erroLeitura}).`, erro: true } : { texto: 'carregando…', erro: false };
  else if (!abertos.length) estado = { texto: 'Nada esperando por você.', erro: false };

  return (
    <section id="pendentes" aria-labelledby="t-pendentes">
      <div className="sec-cab">
        <h2 id="t-pendentes">Pendentes</h2>
        {carregou && (
          <span className="contagem">{NF.format(abertos.length)} abertos · {NF.format(fechados.length)} fechados</span>
        )}
      </div>
      {estado && <p className={'estado' + (estado.erro ? ' erro' : '')}>{estado.texto}</p>}
      <div className="lista-pend">
        {abertos.map((p) => (
          <CartaoPendente key={p.id} p={p} msgs={porItem.get(p.id) || []} agora={agora} erros={erros} recarregar={recarregar} />
        ))}
      </div>
      {fechados.length > 0 && (
        <details className="fechados">
          <summary>Fechados ({NF.format(fechados.length)})</summary>
          <ul className="lista-fech">
            {fechados.slice(0, MAX_FECHADOS).map((p) => (
              <ItemFechado key={p.id} p={p} agora={agora} erros={erros} recarregar={recarregar} />
            ))}
            {fechados.length > MAX_FECHADOS && (
              <li className="fech-mais">mostrando os {MAX_FECHADOS} mais recentes de {NF.format(fechados.length)}</li>
            )}
          </ul>
        </details>
      )}
    </section>
  );
}
