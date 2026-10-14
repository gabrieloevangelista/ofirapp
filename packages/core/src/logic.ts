import { MATS, STAGES, SYSTEMS, SUPPLIERS, Supplier } from './data';

export const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const stageName = (k: string) => (STAGES.find(s => s[0] === k) || MATS.find(s => s[0] === k) || [k, k])[1];
export const sysName = (k: string) => SYSTEMS.find(s => s.k === k)?.n;
export const supByName = (n: string) => SUPPLIERS.find(s => s.n === n)!;

export const BRL = (v: number) =>
  v >= 1e6
    ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi'
    : 'R$ ' + Math.round(v / 1000).toLocaleString('pt-BR') + ' mil';
export const BRLc = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const rate = (r: number) => r.toFixed(1).replace('.', ',');
export const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export interface Filters { seg: 'svc' | 'mat'; stage: string; sys: string; city: string }
export const defaultFilters: Filters = { seg: 'svc', stage: 'all', sys: 'all', city: '' };
export const segList = (seg: 'svc' | 'mat') => (seg === 'mat' ? MATS : STAGES);

export function filterSuppliers(f: Filters): Supplier[] {
  const keys = STAGES.map(s => s[0]);
  return SUPPLIERS.filter(x =>
    x.kind === 'svc' &&
    x.cats.some(c => keys.includes(c)) &&
    (f.stage === 'all' || x.cats.includes(f.stage) || x.e === f.stage) &&
    (f.sys === 'all' || x.s === f.sys || x.s === 'all') &&
    (!f.city || x.atende.some(c => norm(c) === norm(f.city)) || norm(x.c).includes(norm(f.city))));
}
/** categoria exibida no card, de acordo com o filtro atual */
export function catOf(x: Supplier, f: Filters) {
  const keys = STAGES.map(s => s[0]);
  return f.stage !== 'all' && x.cats.includes(f.stage) ? f.stage : (x.cats.find(c => keys.includes(c)) || x.e);
}
export function filterSummary(f: Filters, n: number) {
  const parts: string[] = [];
  if (f.stage !== 'all') parts.push(stageName(f.stage));
  if (f.sys !== 'all') parts.push(sysName(f.sys)!);
  if (f.city) return `${n} ${n === 1 ? 'fornecedor atende' : 'fornecedores atendem'} ${f.city}${parts.length ? ' · ' + parts.join(' · ') : ''}`;
  if (parts.length) return `${n} ${n === 1 ? 'resultado' : 'resultados'} para ${parts.join(' · ')}`;
  return 'Empresas com documentação conferida e avaliações de obras concluídas.';
}

// ---- simulador ----
export const STANDARDS = ['Médio', 'Alto', 'Alto Luxo', 'High-End'];
export const BASE_M2 = [2900, 4200, 6200, 8800]; // R$/m² por padrão, valores de protótipo
export function simulate(area: number, sysKey: string, std: number) {
  const s = SYSTEMS.find(x => x.k === sysKey)!;
  const stdIdx = Math.min(BASE_M2.length - 1, Math.max(0, std));
  const m2Base = BASE_M2[stdIdx] * s.c;
  const mid = area * m2Base;
  const months = Math.max(2, Math.round((3 + area / 22) * s.p * (1 + stdIdx * 0.10)));
  const m2Min = Math.round(m2Base * 0.9);
  const m2Max = Math.round(m2Base * 1.12);
  const fmtM2 = (v: number) => 'R$ ' + v.toLocaleString('pt-BR');
  const fmtFull = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  return {
    cost: fmtFull(mid * 0.9) + ' a ' + fmtFull(mid * 1.12),
    time: months + ' meses',
    m2: fmtM2(m2Min) + ' a ' + fmtM2(m2Max) + ' / m²',
    m2Val: fmtM2(Math.round(m2Base)) + ' / m²',
  };
}

// ---- orçamento ----
export interface OrcItem { id: string; kind: 'mat' | 'svc'; sup: string; n: string; un: string; p: number; qty: number }
export interface OrcGroup { sup: string; x: Supplier; items: OrcItem[]; sub: number; frete: number; total: number; ok: boolean }
export const serves = (x: Supplier, city: string) => !city || x.atende.some(c => norm(c) === norm(city));

export function groupsOf(items: OrcItem[], city: string): OrcGroup[] {
  const map = new Map<string, OrcItem[]>();
  items.forEach(i => { if (!map.has(i.sup)) map.set(i.sup, []); map.get(i.sup)!.push(i); });
  return [...map].map(([sup, its]) => {
    const x = supByName(sup);
    const sub = its.reduce((s, i) => s + i.p * i.qty, 0);
    const frete = its.some(i => i.kind === 'mat') ? x.frete || 0 : 0;
    return { sup, x, items: its, sub, frete, total: sub + frete, ok: serves(x, city) };
  });
}
export function totalsOf(groups: OrcGroup[]) {
  const t = { mat: 0, svc: 0, frete: 0, total: 0 };
  groups.forEach(g => { g.items.forEach(i => { if (i.kind === 'mat') t.mat += i.p * i.qty; else t.svc += i.p * i.qty; }); t.frete += g.frete; });
  t.total = t.mat + t.svc + t.frete;
  return t;
}

// ---- SLA de 72 horas para cotações e orçamentos ----
export interface QuoteCountdown {
  remainingMs: number;
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  formattedText: string;
  progressPercent: number;
  hasProposal: boolean;
  isExpired: boolean;
}

export function calcQuoteCountdown(conv: { deadlineAt?: number; createdAt?: number; msgs?: any[] }, now = Date.now()): QuoteCountdown {
  const totalMs = 72 * 3600 * 1000;
  const deadline = conv.deadlineAt || (conv.createdAt ? conv.createdAt + totalMs : now + totalMs);
  const remainingMs = Math.max(0, deadline - now);
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const hasProposal = Boolean(conv.msgs?.some(m => m.t === 'prop'));
  const isExpired = remainingMs <= 0;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const formattedText = hours > 0 ? `${hours}h ${minutes}m restantes` : `${minutes}m ${seconds}s restantes`;

  return {
    remainingMs,
    totalMs,
    hours,
    minutes,
    seconds,
    formattedTime,
    formattedText,
    progressPercent,
    hasProposal,
    isExpired
  };
}

// ---- Janela de cancelamento / desistência de 24 horas ----
export const CANCELLATION_WINDOW_MS = 24 * 3600 * 1000;

export interface CancellationWindow {
  canCancel: boolean;
  isExpired: boolean;
  remainingMs: number;
  hoursRemaining: number;
  minutesRemaining: number;
  formattedRemaining: string;
}

export function calc24hCancellation(createdAtMs?: number, createdDateStr?: string, now = Date.now()): CancellationWindow {
  let created = createdAtMs;
  if (!created && createdDateStr) {
    if (createdDateStr.toLowerCase().includes('ontem')) {
      created = now - 20 * 3600 * 1000;
    } else if (createdDateStr.toLowerCase().includes('hoje') || createdDateStr.match(/^\d{2}\/\d{2}/)) {
      created = now - 2 * 3600 * 1000;
    }
  }
  if (!created) created = now;

  const deadline = created + CANCELLATION_WINDOW_MS;
  const remainingMs = Math.max(0, deadline - now);
  const isExpired = remainingMs <= 0;
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  return {
    canCancel: !isExpired,
    isExpired,
    remainingMs,
    hoursRemaining: hours,
    minutesRemaining: minutes,
    formattedRemaining: hours > 0 ? `${hours}h ${minutes}m restantes` : `${minutes}m restantes`
  };
}
