import { fmtN, fmtQuando, fmtTok, fmtUsd, NF, NF1, num, str } from '@/lib/formato';
import type { Cota, Custo, Sessao } from '@/lib/tipos';

const ORDEM_BALDE: Record<string, number> = { '5h': 0, semanal: 1, fable: 2, nuvem: 3 };

function Estado({ texto, erro }: { texto: string | null; erro?: boolean }) {
  return texto ? <p className={'estado' + (erro ? ' erro' : '')}>{texto}</p> : null;
}

function Cotas({ cotas, agora }: { cotas: Cota[]; agora: number }) {
  const lista = [...cotas].sort(
    (a, b) => str(a.conta).localeCompare(str(b.conta), 'pt-BR') || (ORDEM_BALDE[a.balde] ?? 9) - (ORDEM_BALDE[b.balde] ?? 9),
  );
  return (
    <div className="grade-cotas">
      {lista.map((c) => {
        const bruto = num(c.usado_pct);
        const p = Math.max(0, Math.min(100, bruto));
        const nivel = bruto >= 90 ? 'critico' : bruto >= 70 ? 'atencao' : 'ok';
        const rotulo = `${str(c.conta) || c.id} · ${str(c.balde) || '—'}`;
        return (
          <div key={c.id} className={'cota ' + nivel}>
            <div className="cota-rot">
              <span className="cota-nome"><strong>{str(c.conta) || c.id}</strong>{' · ' + (str(c.balde) || '—')}</span>
              <span className="cota-pct">
                {NF1.format(bruto)}%
                {nivel !== 'ok' && <span className="nivel">{nivel === 'critico' ? 'crítico' : 'atenção'}</span>}
              </span>
            </div>
            <div
              className="trilho" role="meter" aria-label={rotulo}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}
            >
              <div className="enche" style={{ width: p + '%' }} />
            </div>
            <div className="cota-pe">renova {fmtQuando(c.renova_em, agora)} · medido {fmtQuando(c.medido_em, agora)}</div>
          </div>
        );
      })}
    </div>
  );
}

type Soma = { sessoes: number; tokens_out: number; cache_read: number; cache_create: number; turnos: number };
const zero = (): Soma => ({ sessoes: 0, tokens_out: 0, cache_read: 0, cache_create: 0, turnos: 0 });

function LinhaModelo({ nome, t }: { nome: string; t: Soma }) {
  return (
    <tr>
      <td>{nome}</td>
      <td className="n">{fmtN(t.sessoes)}</td>
      <td className="n">{fmtTok(t.tokens_out)}</td>
      <td className="n">{fmtTok(t.cache_read)}</td>
      <td className="n">{fmtTok(t.cache_create)}</td>
      <td className="n">{fmtN(t.turnos)}</td>
    </tr>
  );
}

export default function Tokens({
  cotas, sessoes, custo, agora, carregou, erroLeitura,
}: {
  cotas: Cota[];
  sessoes: Sessao[];
  custo: Custo[];
  agora: number;
  carregou: boolean;
  erroLeitura: string | null;
}) {
  const carregando = !carregou
    ? erroLeitura ? `Não consegui ler os dados (${erroLeitura}).` : 'carregando…'
    : null;
  const erro = !carregou && !!erroLeitura;

  const lista = [...sessoes].sort((a, b) => num(b.tokens_out) - num(a.tokens_out));
  const alertas = lista.filter((s) => s.alerta).length;

  const por = new Map<string, Soma>();
  const tot = zero();
  for (const s of lista) {
    const k = str(s.modelo) || '(sem modelo)';
    const t = por.get(k) || zero();
    t.sessoes++; tot.sessoes++;
    for (const c of ['tokens_out', 'cache_read', 'cache_create', 'turnos'] as const) {
      t[c] += num(s[c]); tot[c] += num(s[c]);
    }
    por.set(k, t);
  }
  const modelos = [...por].sort((a, b) => b[1].tokens_out - a[1].tokens_out);

  const custos = [...custo].sort((a, b) => num(b.usd_estimado) - num(a.usd_estimado));
  const totC = { tokens_in: 0, tokens_out: 0, cache_read: 0, usd: 0 };
  for (const c of custos) {
    totC.tokens_in += num(c.tokens_in); totC.tokens_out += num(c.tokens_out);
    totC.cache_read += num(c.cache_read); totC.usd += num(c.usd_estimado);
  }

  return (
    <section id="tokens" aria-labelledby="t-tokens">
      <div className="sec-cab">
        <h2 id="t-tokens">Tokens</h2>
        {carregou && (
          <span className="contagem">
            {NF.format(lista.length)} sessões{alertas ? ` · ${alertas} em excesso` : ''}
          </span>
        )}
      </div>

      <div className="bloco">
        <h3 className="subtitulo">Cota das contas</h3>
        <Estado texto={carregando ?? (cotas.length ? null : 'Nenhuma medição de cota.')} erro={erro} />
        <Cotas cotas={cotas} agora={agora} />
      </div>

      <div className="bloco">
        <h3 className="subtitulo">Sessões por tokens de saída</h3>
        <Estado texto={carregando ?? (lista.length ? null : 'Nenhuma sessão medida.')} erro={erro} />
        {lista.length > 0 && (
          <div className="rola">
            <table>
              <thead>
                <tr>
                  <th scope="col">Projeto</th>
                  <th scope="col">Modelo</th>
                  <th scope="col">Papel</th>
                  <th scope="col" className="n">Tokens out</th>
                  <th scope="col" className="n">Cache read</th>
                  <th scope="col" className="n">Turnos</th>
                  <th scope="col" className="n">Último turno</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.sessao_id} className={s.alerta ? 'alerta' : undefined}>
                    <td>
                      <div className="cel-proj">
                        <span>{str(s.projeto) || '—'}</span>
                        {s.alerta && <span className="pill pill-ruim">excesso</span>}
                      </div>
                      <div className="cel-sub" title={s.sessao_id}>
                        {[str(s.conta), s.sessao_id.slice(0, 8)].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>{str(s.modelo) || '—'}</td>
                    <td>{str(s.papel) || '—'}</td>
                    <td className="n">{fmtTok(s.tokens_out)}</td>
                    <td className="n">{fmtTok(s.cache_read)}</td>
                    <td className="n">{fmtN(s.turnos)}</td>
                    <td className="n">{fmtQuando(s.ultimo_turno, agora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grade-tabelas">
        <div className="bloco">
          <h3 className="subtitulo">Totais por modelo</h3>
          <Estado texto={carregando ?? (modelos.length ? null : 'Sem sessões para somar.')} erro={erro} />
          {modelos.length > 0 && (
            <div className="rola">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Modelo</th>
                    <th scope="col" className="n">Sessões</th>
                    <th scope="col" className="n">Tokens out</th>
                    <th scope="col" className="n">Cache read</th>
                    <th scope="col" className="n">Cache create</th>
                    <th scope="col" className="n">Turnos</th>
                  </tr>
                </thead>
                <tbody>
                  {modelos.map(([k, t]) => <LinhaModelo key={k} nome={k} t={t} />)}
                </tbody>
                {modelos.length > 1 && (
                  <tfoot><LinhaModelo nome="Total" t={tot} /></tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        <div className="bloco">
          <h3 className="subtitulo">Custo por frente</h3>
          <Estado texto={carregando ?? (custos.length ? null : 'Nenhum custo registrado.')} erro={erro} />
          {custos.length > 0 && (
            <div className="rola">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Frente</th>
                    <th scope="col">Período</th>
                    <th scope="col" className="n">Tokens in</th>
                    <th scope="col" className="n">Tokens out</th>
                    <th scope="col" className="n">Cache read</th>
                    <th scope="col" className="n">US$ estim.</th>
                    <th scope="col" className="n">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {custos.map((c) => (
                    <tr key={c.id}>
                      <td>{str(c.frente) || c.id}</td>
                      <td>{str(c.periodo) || '—'}</td>
                      <td className="n">{fmtTok(c.tokens_in)}</td>
                      <td className="n">{fmtTok(c.tokens_out)}</td>
                      <td className="n">{fmtTok(c.cache_read)}</td>
                      <td className="n">{fmtUsd(c.usd_estimado)}</td>
                      <td className="n">{fmtQuando(c.atualizado_em, agora)}</td>
                    </tr>
                  ))}
                </tbody>
                {custos.length > 1 && (
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td />
                      <td className="n">{fmtTok(totC.tokens_in)}</td>
                      <td className="n">{fmtTok(totC.tokens_out)}</td>
                      <td className="n">{fmtTok(totC.cache_read)}</td>
                      <td className="n">{fmtUsd(totC.usd)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
