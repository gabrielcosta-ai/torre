import { fmtQuando, NF, str } from '@/lib/formato';
import type { Frente, Recruta } from '@/lib/tipos';

function CartaoFrente({ f, abertos, agora }: { f: Frente; abertos: number; agora: number }) {
  const recrutas = Array.isArray(f.recrutas) ? (f.recrutas as Recruta[]).filter(Boolean) : [];
  return (
    <article className={'frente' + (f.travado ? ' travado' : f.risco ? ' risco' : '')}>
      <div className="frente-cab">
        <h3>{f.nome}</h3>
        {f.atualizado_em && <time dateTime={f.atualizado_em}>{fmtQuando(f.atualizado_em, agora)}</time>}
      </div>
      <p className="frente-sub">
        <strong>{str(f.operador) || 'sem operador'}</strong>
        {f.modelo ? ' · ' + f.modelo : ''}
      </p>
      {f.travado && <p className="faixa faixa-travado"><strong>Travado:</strong>{f.travado}</p>}
      {f.risco && <p className="faixa faixa-risco"><strong>Risco:</strong>{f.risco}</p>}
      <p className="marco">
        <span>{str(f.marco_atual) || '—'}</span>
        <span className="seta" aria-label="próximo">→</span>
        <span className="prox">{str(f.proximo_marco) || '—'}</span>
      </p>
      {abertos > 0 && (
        <p className="frente-pend">{abertos === 1 ? '1 pendente aberto' : `${abertos} pendentes abertos`}</p>
      )}
      <ul className="recrutas" aria-label="Recrutas">
        {recrutas.length ? (
          recrutas.map((r, i) => (
            <li key={i}>{[r.nome, r.modelo, r.effort].map(str).filter(Boolean).join(' · ') || '—'}</li>
          ))
        ) : (
          <li className="vazio">sem recrutas</li>
        )}
      </ul>
    </article>
  );
}

export default function Frentes({
  frentes, abertosPorFrente, agora, carregou, erroLeitura,
}: {
  frentes: Frente[];
  abertosPorFrente: Map<string, number>;
  agora: number;
  carregou: boolean;
  erroLeitura: string | null;
}) {
  const peso = (f: Frente) => (f.travado ? 2 : f.risco ? 1 : 0);
  const lista = [...frentes].sort((a, b) => peso(b) - peso(a) || str(a.nome).localeCompare(str(b.nome), 'pt-BR'));
  const trav = lista.filter((f) => f.travado).length;
  const ris = lista.filter((f) => !f.travado && f.risco).length;

  let estado: { texto: string; erro: boolean } | null = null;
  if (!carregou) estado = erroLeitura ? { texto: `Não consegui ler os dados (${erroLeitura}).`, erro: true } : { texto: 'carregando…', erro: false };
  else if (!lista.length) estado = { texto: 'Nenhuma frente registrada.', erro: false };

  return (
    <section id="frentes" aria-labelledby="t-frentes">
      <div className="sec-cab">
        <h2 id="t-frentes">Frentes</h2>
        {carregou && (
          <span className="contagem">
            {NF.format(lista.length)} frentes
            {trav ? ` · ${trav} travada${trav > 1 ? 's' : ''}` : ''}
            {ris ? ` · ${ris} em risco` : ''}
          </span>
        )}
      </div>
      {estado && <p className={'estado' + (estado.erro ? ' erro' : '')}>{estado.texto}</p>}
      <div className="grade-frentes">
        {lista.map((f) => (
          <CartaoFrente key={f.nome} f={f} abertos={abertosPorFrente.get(f.nome) || 0} agora={agora} />
        ))}
      </div>
    </section>
  );
}
