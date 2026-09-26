import { ErroHttp } from './http';
import { fusoTorre } from './env';

const RE_TS =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,6}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/;

/** Deslocamento (min) do fuso em um instante UTC. Ex.: America/Sao_Paulo -> -180. */
function deslocamento(fuso: string, utcMs: number): number {
  const nome = new Intl.DateTimeFormat('en-US', { timeZone: fuso, timeZoneName: 'longOffset' })
    .formatToParts(new Date(utcMs))
    .find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(nome);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
}

/**
 * Aceita ISO com fuso (Z ou ±hh:mm), ISO sem fuso (hora local de TORRE_TZ, como o coletor grava:
 * "2026-09-26T09:41"), só a data, ou epoch em s/ms. Devolve ISO UTC para gravar em timestamptz.
 * null/'' -> null. Qualquer outra coisa -> 400.
 */
export function paraTs(v: unknown, campo: string): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 1e8) throw new ErroHttp(400, `${campo}: data inválida`);
    return new Date(v > 1e12 ? v : v * 1000).toISOString();
  }
  if (typeof v !== 'string') throw new ErroHttp(400, `${campo}: data inválida`);
  const m = RE_TS.exec(v.trim());
  if (!m) throw new ErroHttp(400, `${campo}: data inválida (use ISO 8601)`);
  const [, a, me, d, h, mi, s, frac, tz] = m;
  const ms = frac ? Number(frac.padEnd(3, '0').slice(0, 3)) : 0;
  const parede = Date.UTC(+a, +me - 1, +d, +(h || 0), +(mi || 0), +(s || 0), ms);
  if (Number.isNaN(parede)) throw new ErroHttp(400, `${campo}: data inválida`);
  let utc: number;
  if (tz === 'Z') utc = parede;
  else if (tz) {
    const sinal = tz[0] === '-' ? -1 : 1;
    const hh = Number(tz.slice(1, 3));
    const mm = Number(tz.slice(-2));
    utc = parede - sinal * (hh * 60 + mm) * 60000;
  } else {
    const fuso = fusoTorre();
    // duas passadas resolvem a virada de horário de verão
    let off = deslocamento(fuso, parede);
    off = deslocamento(fuso, parede - off * 60000);
    utc = parede - off * 60000;
  }
  const dt = new Date(utc);
  if (Number.isNaN(dt.getTime())) throw new ErroHttp(400, `${campo}: data inválida`);
  return dt.toISOString();
}
