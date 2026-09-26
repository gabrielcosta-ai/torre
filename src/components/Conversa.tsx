'use client';

import { useState } from 'react';
import { api } from '@/lib/cliente';
import { fmtIdade, fmtQuando, NF } from '@/lib/formato';
import type { Mensagem } from '@/lib/tipos';

const MAX_HIST = 30;

export function naoLidas(ms: Mensagem[]): Mensagem[] {
  return ms.filter((m) => m.de !== 'gabriel' && !m.lida_em);
}

function Msg({ m, agora }: { m: Mensagem; agora: number }) {
  const minha = m.de === 'gabriel';
  return (
    <li className={'msg' + (minha ? ' minha' : '')}>
      <div className="msg-cab">
        <strong>{minha ? 'você' : m.de}</strong>
        <span title={fmtIdade(m.criado_em, agora)}>{fmtQuando(m.criado_em, agora)}</span>
        {minha && <span>{m.lida_em ? `lida ${fmtQuando(m.lida_em, agora)}` : 'ainda não lida'}</span>}
      </div>
      <p className="msg-texto">{m.texto}</p>
    </li>
  );
}

/**
 * Thread de mensagens: do item ("Pedir explicação") ou geral ("Falar com o maestro").
 * Mensagens não lidas de quem não é o Gabriel ficam em destaque no topo até "Marcar como lidas".
 */
export default function Conversa({
  mensagens, pendenteId, agora, aoMudar, placeholder, idCampo,
}: {
  mensagens: Mensagem[];
  pendenteId: string | null;
  agora: number;
  aoMudar: () => void;
  placeholder: string;
  idCampo: string;
}) {
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: '' | 'erro' | 'ok' } | null>(null);

  const novas = naoLidas(mensagens);
  const idsNovas = new Set(novas.map((m) => m.id));
  const hist = mensagens.filter((m) => !idsNovas.has(m.id));
  const mostra = hist.slice(-MAX_HIST);

  async function enviar() {
    const t = texto.trim();
    if (!t || ocupado) return;
    setOcupado(true);
    setAviso({ texto: 'enviando…', tipo: '' });
    try {
      await api('POST', '/api/mensagens', { texto: t, pendente_id: pendenteId });
      setTexto('');
      setAviso({ texto: 'Enviado.', tipo: 'ok' });
      aoMudar();
    } catch (e) {
      setAviso({ texto: `não enviou (${(e as Error).message}); o texto continua aqui`, tipo: 'erro' });
    } finally {
      setOcupado(false);
    }
  }

  async function marcarLidas() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await Promise.all(novas.map((m) => api('PATCH', `/api/mensagens/${m.id}`, {})));
      setAviso(null);
      aoMudar();
    } catch (e) {
      setAviso({ texto: `não marcou como lidas (${(e as Error).message})`, tipo: 'erro' });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="thread">
      {novas.length > 0 && (
        <div className="novas" aria-live="polite">
          <div className="novas-cab">
            <strong>{novas.length === 1 ? '1 mensagem nova' : `${NF.format(novas.length)} mensagens novas`}</strong>
            <button type="button" className="btn btn-mini" onClick={marcarLidas} disabled={ocupado}>
              Marcar como lidas
            </button>
          </div>
          <ul className="msgs">{novas.map((m) => <Msg key={m.id} m={m} agora={agora} />)}</ul>
        </div>
      )}
      {hist.length > MAX_HIST && (
        <p className="msgs-mais">mostrando as {MAX_HIST} mais recentes de {NF.format(hist.length)}</p>
      )}
      {mostra.length > 0 ? (
        <ul className="msgs">{mostra.map((m) => <Msg key={m.id} m={m} agora={agora} />)}</ul>
      ) : (
        novas.length === 0 && <p className="vazio">Nenhuma mensagem ainda.</p>
      )}
      <div className="thread-form">
        <label htmlFor={idCampo} className="sr">Mensagem</label>
        <textarea
          id={idCampo} className="msg-in" maxLength={4000} placeholder={placeholder} value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); enviar(); }
          }}
        />
        <div className="thread-acoes">
          <button type="button" className="btn btn-go" onClick={enviar} disabled={ocupado || !texto.trim()}>
            Enviar
          </button>
          {aviso && <span className={`pend-aviso ${aviso.tipo}`} role="status" aria-live="polite">{aviso.texto}</span>}
        </div>
      </div>
    </div>
  );
}
