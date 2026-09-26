/** Formatação pt-BR usada pela tela (roda no navegador). */

export const NF = new Intl.NumberFormat('pt-BR');
export const NF1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const USD = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

export function str(v: unknown): string {
  return v == null ? '' : String(v);
}
export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
export function fmtN(v: unknown): string {
  return v == null || v === '' ? '—' : NF.format(num(v));
}
/** Tokens: k a partir de 10 mil (12,3k; 456k) e M a partir de 1 milhão (5M; 12,4M). */
export function fmtTok(v: unknown): string {
  if (v == null || v === '') return '—';
  const n = num(v);
  const a = Math.abs(n);
  if (a >= 1e6) {
    const m = n / 1e6;
    return (Math.abs(m) >= 100 ? NF.format(Math.round(m)) : NF1.format(m)) + 'M';
  }
  if (a >= 10000) {
    const k = n / 1000;
    return (Math.abs(k) >= 100 ? NF.format(Math.round(k)) : NF1.format(k)) + 'k';
  }
  return NF.format(n);
}
export function fmtUsd(v: unknown): string {
  return v == null || v === '' ? '—' : USD.format(num(v));
}
export function cmp(a: unknown, b: unknown): number {
  const x = str(a), y = str(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

function z2(n: number) {
  return String(n).padStart(2, '0');
}
export function data(iso: unknown): Date | null {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
/** Hoje: "09:41". Outro dia: "25/09 18:02". */
export function fmtQuando(iso: unknown, agora = Date.now()): string {
  const d = data(iso);
  if (!d) return iso ? str(iso) : '—';
  const hoje = new Date(agora);
  const hm = `${z2(d.getHours())}:${z2(d.getMinutes())}`;
  const mesmoDia = d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate();
  return mesmoDia ? hm : `${z2(d.getDate())}/${z2(d.getMonth() + 1)} ${hm}`;
}
export function idadeMin(iso: unknown, agora = Date.now()): number | null {
  const d = data(iso);
  return d ? Math.round((agora - d.getTime()) / 60000) : null;
}
export function fmtIdade(iso: unknown, agora = Date.now()): string {
  const m = idadeMin(iso, agora);
  if (m == null) return '';
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  if (m < 48 * 60) return `há ${Math.floor(m / 60)} h`;
  return `há ${Math.floor(m / 1440)} d`;
}
export function fmtHoraSeg(ms: number): string {
  const d = new Date(ms);
  return `${z2(d.getHours())}:${z2(d.getMinutes())}:${z2(d.getSeconds())}`;
}
