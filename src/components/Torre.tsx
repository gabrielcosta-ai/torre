'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Conversa, { naoLidas } from './Conversa';
import Frentes from './Frentes';
import Memoria from './Memoria';
import Pendentes, { type ErrosGrav, estaAberto } from './Pendentes';
import Tokens from './Tokens';
import { api } from '@/lib/cliente';
import { fmtHoraSeg, fmtIdade, fmtQuando, idadeMin, NF } from '@/lib/formato';
import type { Resumo } from '@/lib/tipos';

const POLLING_MS = 15_000;
const RELOGIO_MS = 30_000;

type Painel = 'maestro' | 'aparelho' | null;
type Aviso = { texto: string; tipo: '' | 'erro' | 'ok' } | null;

/** "Adicionar aparelho": gera o código de 6 dígitos (10 min, uso único) para /entrar no aparelho novo. */
function PainelAparelho({ agora, fechar }: { agora: number; fechar: () => void }) {
  const [convite, setConvite] = useState<{ codigo: string; expira_em: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  async function gerar() {
    if (ocupado) return;
    setOcupado(true);
    setAviso({ texto: 'gerando…', tipo: '' });
    try {
      const r = await api<{ codigo: string; expira_em: string }>('POST', '/api/auth/convite', {});
      setConvite(r);
      setAviso(null);
    } catch (e) {
      setAviso({ texto: `não gerou (${(e as Error).message}); tente de novo`, tipo: 'erro' });
    } finally {
      setOcupado(false);
    }
  }

  const restante = convite ? -(idadeMin(convite.expira_em, agora) ?? 0) : 0;
  const expirado = !!convite && restante <= 0;

  return (
    <div className="painel" id="painel-aparelho">
      <div className="painel-cab">
        <h2>Adicionar aparelho</h2>
        <button type="button" className="btn btn-fantasma" onClick={fechar}>Fechar</button>
      </div>
      <p className="painel-dica">
        Uma chave por aparelho. Gere um código aqui e, no aparelho novo, abra <span className="mono">/entrar</span>,
        digite o código e o nome do aparelho, e crie a chave. Vale 10 minutos e uma vez só; gerar outro anula o anterior.
      </p>
      {convite && !expirado && (
        <p>
          <span className="codigo" aria-label={`código ${convite.codigo.split('').join(' ')}`}>{convite.codigo}</span>
          <br />
          <span className="painel-dica">vale até {fmtQuando(convite.expira_em, agora)} (cerca de {Math.max(1, restante)} min)</span>
        </p>
      )}
      {expirado && <p className="pend-aviso erro">O código expirou. Gere outro.</p>}
      <div className="thread-acoes">
        <button type="button" className="btn btn-go" onClick={gerar} disabled={ocupado}>
          {convite ? 'Gerar outro código' : 'Gerar código'}
        </button>
        {aviso && <span className={`pend-aviso ${aviso.tipo}`} role="status" aria-live="polite">{aviso.texto}</span>}
      </div>
    </div>
  );
}

export default function Torre() {
  const [dados, setDados] = useState<Resumo | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [ultimaLeitura, setUltimaLeitura] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [painel, setPainel] = useState<Painel>(null);
  const [saindo, setSaindo] = useState(false);
  const [avisoTopo, setAvisoTopo] = useState<string | null>(null);
  const [errosMapa, setErrosMapa] = useState<Record<string, string>>({});
  const lendo = useRef(false);
  const deNovo = useRef(false);

  const carregar = useCallback(async () => {
    // Uma leitura por vez; pedido feito durante a leitura vira uma nova leitura logo depois.
    if (lendo.current) { deNovo.current = true; return; }
    lendo.current = true;
    try {
      do {
        deNovo.current = false;
        try {
          const r = await api<Resumo>('GET', '/api/resumo');
          setDados(r);
          setErroLeitura(null);
          setUltimaLeitura(Date.now());
        } catch (e) {
          setErroLeitura((e as Error).message || 'erro');
        }
        setAgora(Date.now());
      } while (deNovo.current);
    } finally {
      lendo.current = false;
    }
  }, []);

  useEffect(() => {
    carregar();
    const poll = setInterval(() => { if (!document.hidden) carregar(); }, POLLING_MS);
    const relogio = setInterval(() => setAgora(Date.now()), RELOGIO_MS);
    const aoVoltar = () => { if (!document.hidden) carregar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('online', aoVoltar);
    return () => {
      clearInterval(poll);
      clearInterval(relogio);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('online', aoVoltar);
    };
  }, [carregar]);

  const erros: ErrosGrav = useMemo(() => ({
    de: (id) => errosMapa[id],
    marcar: (id, msg) => setErrosMapa((m) => ({ ...m, [id]: msg })),
    limpar: (id) => setErrosMapa((m) => {
      if (!(id in m)) return m;
      const n = { ...m };
      delete n[id];
      return n;
    }),
  }), [errosMapa]);

  const carregou = !!dados;
  const pendentes = dados?.pendentes || [];
  const mensagens = dados?.mensagens || [];
  const abertos = pendentes.filter(estaAberto);
  const geral = mensagens.filter((m) => !m.pendente_id);
  const novasGeral = naoLidas(geral).length;

  const abertosPorFrente = new Map<string, number>();
  for (const p of abertos) if (p.frente) abertosPorFrente.set(p.frente, (abertosPorFrente.get(p.frente) || 0) + 1);

  // Mensagem nova do maestro na thread geral abre o painel (uma vez por aumento da contagem).
  const novasAntes = useRef(0);
  useEffect(() => {
    if (novasGeral > novasAntes.current && painel === null) setPainel('maestro');
    novasAntes.current = novasGeral;
  }, [novasGeral, painel]);

  // "atualizado há X": a medição mais recente que os agentes mandaram.
  let maisNovo = '';
  if (dados) {
    const ver = (v: string | null | undefined) => { if (v && v > maisNovo) maisNovo = v; };
    dados.frentes.forEach((f) => ver(f.atualizado_em));
    dados.custo.forEach((c) => ver(c.atualizado_em));
    dados.cotas.forEach((c) => ver(c.medido_em));
    dados.sessoes.forEach((s) => ver(s.atualizado_em));
    ver(dados.memoria?.medido_em);
  }
  const idade = maisNovo ? idadeMin(maisNovo, agora) : null;
  let textoAtualizado = 'carregando';
  if (dados) textoAtualizado = maisNovo ? `atualizado ${fmtIdade(maisNovo, agora)}` : 'atualizado —';
  else if (erroLeitura) textoAtualizado = 'sem dados';
  const velho = (idade != null && idade > 60) || !!erroLeitura;

  async function sair() {
    if (saindo) return;
    setSaindo(true);
    setAvisoTopo(null);
    try {
      await api('POST', '/api/auth/sair', {});
      window.location.assign('/entrar');
    } catch (e) {
      setAvisoTopo(`Não saiu (${(e as Error).message}). Tente de novo.`);
      setSaindo(false);
    }
  }

  const alternar = (p: Exclude<Painel, null>) => setPainel((atual) => (atual === p ? null : p));

  return (
    <>
      <header className="topo" id="topo">
        <div className="wrap">
          <div className="topo-linha">
            <h1 className="marca">Torre</h1>
            <span className={'pill' + (carregou && abertos.length > 0 ? ' pill-quente' : '')}>
              {carregou ? (abertos.length === 1 ? '1 aberto' : `${NF.format(abertos.length)} abertos`) : '… abertos'}
            </span>
            <span
              className={'atualizado' + (velho ? ' velho' : '')}
              title={maisNovo ? `dado mais novo: ${fmtQuando(maisNovo, agora)}` : undefined}
            >
              {textoAtualizado}
            </span>
            <div className="topo-acoes">
              <button
                type="button" className="btn btn-maestro" aria-expanded={painel === 'maestro'}
                aria-controls="painel-maestro" onClick={() => alternar('maestro')}
              >
                Falar com o maestro
                {novasGeral > 0 && <span className="pill pill-quente pill-conta">{NF.format(novasGeral)}</span>}
              </button>
              <button
                type="button" className="btn" aria-expanded={painel === 'aparelho'}
                aria-controls="painel-aparelho" onClick={() => alternar('aparelho')}
              >
                Adicionar aparelho
              </button>
              <button type="button" className="btn btn-fantasma" onClick={sair} disabled={saindo}>Sair</button>
            </div>
          </div>
          <nav className="navega" aria-label="Seções">
            <a href="#pendentes">Pendentes</a>
            <a href="#frentes">Frentes</a>
            <a href="#tokens">Tokens</a>
            <a href="#memoria">Memória</a>
          </nav>
        </div>
      </header>

      <main className="wrap">
        {avisoTopo && <p className="aviso-acesso" role="alert">{avisoTopo}</p>}
        {erroLeitura && carregou && (
          <p className="aviso-acesso" role="status">
            <strong>Sem conexão com a Torre ({erroLeitura}).</strong> Mostrando a última leitura
            {ultimaLeitura ? `, das ${fmtHoraSeg(ultimaLeitura)}` : ''}. Tento de novo a cada 15 s.
          </p>
        )}

        {painel === 'maestro' && (
          <div className="painel" id="painel-maestro">
            <div className="painel-cab">
              <h2>Falar com o maestro</h2>
              <button type="button" className="btn btn-fantasma" onClick={() => setPainel(null)}>Fechar</button>
            </div>
            <p className="painel-dica">Conversa geral, fora de uma pendência. O maestro lê aqui e responde nesta mesma thread.</p>
            {carregou ? (
              <Conversa
                mensagens={geral} pendenteId={null} agora={agora} aoMudar={carregar}
                idCampo="msg-geral" placeholder="Escreva para o maestro"
              />
            ) : (
              <p className="estado">carregando…</p>
            )}
          </div>
        )}
        {painel === 'aparelho' && <PainelAparelho agora={agora} fechar={() => setPainel(null)} />}

        <Pendentes
          pendentes={pendentes} mensagens={mensagens} agora={agora} carregou={carregou}
          erroLeitura={erroLeitura} erros={erros} recarregar={carregar}
        />
        <Frentes
          frentes={dados?.frentes || []} abertosPorFrente={abertosPorFrente} agora={agora}
          carregou={carregou} erroLeitura={erroLeitura}
        />
        <Tokens
          cotas={dados?.cotas || []} sessoes={dados?.sessoes || []} custo={dados?.custo || []}
          agora={agora} carregou={carregou} erroLeitura={erroLeitura}
        />
        <Memoria memoria={dados?.memoria || null} agora={agora} carregou={carregou} erroLeitura={erroLeitura} />
      </main>
    </>
  );
}
