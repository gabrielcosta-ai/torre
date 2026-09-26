'use client';

import { useEffect, useRef, useState } from 'react';
import { cmp, fmtN, fmtQuando, NF, num, str } from '@/lib/formato';
import type { FatoRecente, Memoria as TMemoria } from '@/lib/tipos';

function ticksBonitos(max: number): number[] {
  if (max <= 0) return [0, 1];
  const bruto = max / 4;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = Math.max(1, [1, 2, 5, 10].map((m) => m * pot).find((v) => v >= bruto) || 1);
  const t: number[] = [];
  for (let v = 0; v < max + passo; v += passo) {
    t.push(v);
    if (v >= max) break;
  }
  return t;
}

/** Barras horizontais em SVG (mesma geometria do torre.html); redesenha quando a largura muda. */
function GraficoGotchas({ gotchas }: { gotchas: Record<string, number> | null }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(520);

  useEffect(() => {
    const c = caixa.current;
    if (!c) return;
    const medir = () => {
      const w = Math.floor(c.clientWidth);
      if (w) setLargura(Math.max(260, w));
    };
    medir();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(medir);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  let dados = Object.entries(gotchas || {})
    .map(([k, v]) => [k, num(v)] as [string, number])
    .filter((d) => d[1] > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
  if (dados.length > 12) {
    const resto = dados.slice(11);
    dados = dados.slice(0, 11).concat([[`outros (${resto.length})`, resto.reduce((s, d) => s + d[1], 0)]]);
  }

  let conteudo: React.ReactNode;
  if (!dados.length) {
    conteudo = <p className="vazio">{gotchas ? 'Nenhum gotcha registrado nos últimos 7 dias.' : 'Sem medição.'}</p>;
  } else {
    const W = largura;
    const linhaH = 26, topo = 4, eixoH = 20, barraH = 14;
    const rotW = Math.min(170, Math.round(W * 0.36));
    const x0 = rotW + 10, x1 = W - 44;
    const ticks = ticksBonitos(Math.max(...dados.map((d) => d[1])));
    const tmax = ticks[ticks.length - 1];
    const sx = (v: number) => x0 + (x1 - x0) * (v / tmax);
    const altura = topo + dados.length * linhaH;
    const H = altura + eixoH;
    const total = dados.reduce((s, d) => s + d[1], 0);
    const maxChars = Math.max(6, Math.floor(rotW / 7.2));
    conteudo = (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Gotchas por projeto nos últimos 7 dias, ${total} no total`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="g-grade" x1={sx(t)} x2={sx(t)} y1={topo} y2={altura} />
            <text className="g-eixo" x={sx(t)} y={altura + 14} textAnchor="middle">{NF.format(t)}</text>
          </g>
        ))}
        {dados.map(([nome, v], i) => {
          const yMeio = topo + i * linhaH + linhaH / 2;
          const rot = nome.length > maxChars ? nome.slice(0, maxChars - 1) + '…' : nome;
          return (
            <g key={nome} className="g-linha">
              <title>{`${nome}: ${NF.format(v)} gotcha${v === 1 ? '' : 's'}`}</title>
              <rect className="g-fundo" x={0} y={yMeio - linhaH / 2} width={W} height={linhaH} />
              <text className="g-rot" x={rotW} y={yMeio + 4} textAnchor="end">{rot}</text>
              <rect className="g-barra" x={x0} y={yMeio - barraH / 2} width={Math.max(2, sx(v) - x0)} height={barraH} rx={3} />
              <text className="g-val" x={sx(v) + 6} y={yMeio + 4}>{NF.format(v)}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  return <div className="graf-caixa" ref={caixa}>{conteudo}</div>;
}

export default function Memoria({
  memoria, agora, carregou, erroLeitura,
}: {
  memoria: TMemoria | null;
  agora: number;
  carregou: boolean;
  erroLeitura: string | null;
}) {
  const m = memoria;
  // Erro de leitura derruba o bloco inteiro (KPIs, gráfico e fatos), não só o texto de estado.
  const estadoTexto = !carregou
    ? erroLeitura ? `Não consegui ler os dados (${erroLeitura}).` : 'carregando…'
    : m ? null : 'Sem medição do acervo ainda.';
  const erro = !carregou && !!erroLeitura;
  const quebrados = m ? num(m.fatos_quebrados) : 0;
  const projetos = m && m.por_projeto && typeof m.por_projeto === 'object' ? Object.keys(m.por_projeto).length : null;
  const ultimos = (m && Array.isArray(m.ultimos) ? (m.ultimos as FatoRecente[]).filter(Boolean) : [])
    .slice().sort((a, b) => cmp(b.modified, a.modified)).slice(0, 10);

  return (
    <section id="memoria" aria-labelledby="t-memoria">
      <div className="sec-cab">
        <h2 id="t-memoria">Memória</h2>
        <span className="contagem">acervo compartilhado dos agentes</span>
      </div>
      {estadoTexto && <p className={'estado' + (erro ? ' erro' : '')}>{estadoTexto}</p>}
      <div className="kpis">
        <div className="kpi"><span className="kpi-rot">Fatos no acervo</span><span className="kpi-val">{m ? fmtN(m.fatos_total) : '—'}</span></div>
        <div className={'kpi' + (quebrados > 0 ? ' ruim' : '')}><span className="kpi-rot">Fatos quebrados</span><span className="kpi-val">{m ? fmtN(m.fatos_quebrados) : '—'}</span></div>
        <div className="kpi"><span className="kpi-rot">Projetos com fatos</span><span className="kpi-val">{projetos == null ? '—' : fmtN(projetos)}</span></div>
        <div className="kpi kpi-pequeno"><span className="kpi-rot">Medido</span><span className="kpi-val">{m ? fmtQuando(m.medido_em, agora) : '—'}</span></div>
      </div>
      <div className="grade-mem">
        <figure className="graf">
          <figcaption className="subtitulo">Gotchas por projeto, últimos 7 dias</figcaption>
          <p className="legenda">Onde os agentes mais erraram e registraram a lição.</p>
          {carregou ? (
            <GraficoGotchas gotchas={m ? m.gotchas_7d_por_projeto || {} : null} />
          ) : (
            <div className="graf-caixa"><p className="vazio">{erro ? 'sem dados' : 'carregando…'}</p></div>
          )}
        </figure>
        <div className="bloco">
          <h3 className="subtitulo">Últimos 10 fatos</h3>
          <ol className="fatos">
            {!carregou ? (
              <li className="fato"><span className="vazio">{erro ? 'sem dados' : 'carregando…'}</span></li>
            ) : ultimos.length ? (
              ultimos.map((f, i) => (
                <li key={str(f.name) + i} className="fato">
                  <div className="fato-cab">
                    <span className="fato-nome">{str(f.name) || '—'}</span>
                    <span className="fato-quando">{fmtQuando(f.modified, agora)}</span>
                  </div>
                  {f.description && <p className="fato-desc">{str(f.description)}</p>}
                </li>
              ))
            ) : (
              <li className="fato"><span className="vazio">Nenhum fato recente.</span></li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}
