import * as zustandPkg from 'zustand';
import { create as createNamed } from 'zustand';
const create = (typeof createNamed === 'function' ? createNamed : (zustandPkg as any)?.create || (zustandPkg as any)?.default) as typeof createNamed;
import { Filters, OrcItem, defaultFilters, groupsOf, totalsOf, stageName } from './logic';
import { Supplier, PLATFORM_FEE, SUPPLIERS } from './data';
import type { ProjectAnalysis } from './projectAI';

export interface QuoteAttachment {
  file?: { name: string; size: string };
  /** itens do checklist destinados a este fornecedor */
  items?: string[];
}

export type Role = 'owner' | 'supplier';
export interface User {
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  cpfCnpj?: string;
  city?: string;
  uf?: string;
  bio?: string;
}
export interface Address {
  id: string; label: string; cep: string; street: string; num: string; comp?: string; hood?: string; city: string; uf: string;
}
export interface Message {
  t: 'sys' | 'them' | 'me' | 'prop' | 'file' | 'ask';
  x?: string;
  id?: string;
  h?: string;
  name?: string;
  size?: string;
  url?: string;
  me?: boolean;
}
export interface Conversation {
  id: string; n: string; m: string; e: string; stage?: string; area?: number; unread: number; time: string;
  awaiting?: boolean; declined?: boolean; rfq?: string; msgs: Message[];
  createdAt?: number;
  deadlineAt?: number;
}
export interface Proposal {
  id: string; title: string; meta: string; rows: [string, number][]; status: 'open' | 'paid'; conv: string;
}
export interface QuoteItem { sup: string; conv?: string }
export interface Quote {
  id: string;
  label: string;
  created: string;
  createdAtMs?: number;
  items: QuoteItem[];
  sups?: string[];
  status?: string;
  cancelled?: boolean;
  cancelReason?: string;
}
export interface Order {
  id: string;
  pay: string;
  sup: string;
  total: number;
  sub: number;
  frete: number;
  fee: number;
  created: string;
  createdAtMs?: number;
  method: string;
  status: string;
  release: string;
  done: boolean;
  hasMat: boolean;
  items: OrcItem[];
  addr: Address;
  client?: string;
  cancelled?: boolean;
  cancelReason?: string;
}
export interface Toast { id: number; title: string; text?: string }

export type NotificationCategory = 'supplier_reply' | 'new_supplier' | 'platform_news';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  read: boolean;
  badge?: string;
  icon?: string;
  avatar?: string;
  supplierName?: string;
  actionScreen?: string;
  actionLabel?: string;
}

export interface ObraContract {
  sup: string;
  stageName: string;
  value: number;
  status: 'Pago' | 'Protegido' | 'Em andamento' | 'Pendente';
  date?: string;
  stageKey?: string;
  m?: string;
}

export interface ObraStage {
  key: string;
  name: string;
  status: 'done' | 'running' | 'waiting';
  date?: string;
  contract?: ObraContract;
}

export interface Obra {
  name: string;
  area: number;
  system: string;
  systemKey: string;
  city: string;
  uf: string;
  stages: ObraStage[];
}

export const STAGE_WEIGHTS: Record<string, number> = {
  projeto: 12,
  terreno: 12,
  fundacao: 14,
  estrutura: 20,
  cobertura: 10,
  instalacoes: 12,
  esquadrias: 6,
  acabamento: 10,
  paisagismo: 2,
  posobra: 2,
};

export const calcObraProgress = (stages: ObraStage[]): number => {
  let pct = 0;
  for (const s of stages) {
    const w = STAGE_WEIGHTS[s.key] || 10;
    if (s.status === 'done') {
      pct += w;
    } else if (s.status === 'running') {
      pct += (s.contract ? w : Math.round(w * 0.5));
    }
  }
  return Math.min(100, Math.max(0, pct));
};

const today = () => new Date().toLocaleDateString('pt-BR');
const nowH = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

const INITIAL_PROPS: Record<string, Proposal> = {
  p1: {
    id: 'p1',
    title: 'Fundação em radier',
    meta: '420 m² · 26 dias · materiais inclusos',
    rows: [['Etapa 1 · Escavação e preparo', 58200], ['Etapa 2 · Armação e concretagem', 96800], ['Etapa 3 · Cura e entrega', 31000]],
    status: 'open',
    conv: 'c1'
  }
};

const nowInit = Date.now();
const INITIAL_CONVS: Conversation[] = [
  {
    id: 'c1', n: 'Base Forte Fundações', m: 'm1', e: 'Fundação', stage: 'fundacao', unread: 2, time: '09:42',
    createdAt: nowInit - 36 * 3600 * 1000,
    deadlineAt: nowInit + 36 * 3600 * 1000,
    msgs: [
      { t: 'sys', x: 'Pedido de orçamento enviado · Casa térrea 420 m²' },
      { t: 'them', x: 'Olá! Recebi seu pedido para a casa térrea em Atibaia.', h: '09:31' },
      { t: 'them', x: 'Pela sondagem que você anexou, o indicado é radier. Segue a proposta com pagamento por etapa:', h: '09:40' },
      { t: 'prop', id: 'p1' }
    ]
  },
  {
    id: 'c2', n: 'Painel Monolítico EPS', m: 'm9', e: 'Estrutura e vedação', stage: 'estrutura', unread: 0, time: 'ontem',
    createdAt: nowInit - 18 * 3600 * 1000,
    deadlineAt: nowInit + (72 - 18) * 3600 * 1000,
    awaiting: true,
    msgs: [
      { t: 'sys', x: 'Pedido de orçamento enviado · Estrutura em painéis EPS' },
      { t: 'sys', x: 'Prazo de 72 horas iniciado para o fornecedor enviar o orçamento' },
      { t: 'them', x: 'Conseguimos fazer a visita técnica na quinta às 9h. Pode ser?', h: '17:12' },
      { t: 'me', x: 'Pode sim, vou estar no terreno.', h: '17:20' }
    ]
  },
  {
    id: 'c3', n: 'Traço Arquitetura', m: 'm3', e: 'Projeto e aprovação', stage: 'projeto', unread: 0, time: '12 ago',
    createdAt: nowInit - 70 * 3600 * 1000,
    deadlineAt: nowInit + 2 * 3600 * 1000,
    msgs: [
      { t: 'sys', x: 'Contrato fechado · R$ 68.000 · pago pela OFIR' },
      { t: 'them', x: 'Projeto aprovado na prefeitura. Os arquivos estão em Documentos, na sua obra.', h: '10:05' },
      { t: 'me', x: 'Perfeito, obrigado!', h: '10:30' }
    ]
  }
];

const INITIAL_ADDRS: Address[] = [
  { id: 'a1', label: 'Obra', cep: '12940-000', street: 'Estrada da Serra', num: '1200', comp: 'Lote 14', hood: 'Jardim Paulista', city: 'Atibaia', uf: 'SP' }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-2026-00039',
    pay: 'PAG-2026-000039',
    sup: 'Traço Arquitetura',
    total: 68000,
    sub: 68000,
    frete: 0,
    fee: Math.round(68000 * PLATFORM_FEE),
    created: '12/08/2026',
    method: 'Pix',
    status: 'Concluído',
    release: 'R$ 65.960 liberado ao fornecedor em 12/08/2026',
    done: true,
    hasMat: false,
    items: [
      { id: 'i01', kind: 'svc', sup: 'Traço Arquitetura', n: 'Projeto arquitetônico completo e aprovação', un: 'projeto', p: 68000, qty: 1 }
    ],
    addr: INITIAL_ADDRS[0],
    client: 'Você'
  },
  {
    id: 'PED-2026-00040',
    pay: 'PAG-2026-000040',
    sup: 'Base Forte Fundações',
    total: 186000,
    sub: 186000,
    frete: 0,
    fee: Math.round(186000 * PLATFORM_FEE),
    created: 'Hoje',
    createdAtMs: Date.now() - 4 * 3600 * 1000,
    method: 'Pix',
    status: 'Etapa 1 em andamento',
    release: 'Valor liberado por etapa concluída após sua confirmação',
    done: false,
    hasMat: false,
    items: [
      { id: 'i02', kind: 'svc', sup: 'Base Forte Fundações', n: 'Fundação em radier com escavação e armação', un: 'contrato', p: 186000, qty: 1 }
    ],
    addr: INITIAL_ADDRS[0],
    client: 'Você'
  }
];

export const INITIAL_OBRA: Obra = {
  name: 'Casa térrea',
  area: 420,
  system: 'Painéis EPS',
  systemKey: 'eps',
  city: 'Atibaia',
  uf: 'SP',
  stages: [
    {
      key: 'terreno',
      name: 'Sondagem de solo e terraplenagem',
      status: 'done',
      date: '02 set',
      contract: { sup: 'Terra Plana Terraplenagem', stageName: 'Sondagem e terraplenagem', value: 24500, status: 'Pago', m: 'm4' }
    },
    {
      key: 'fundacao',
      name: 'Fundação',
      status: 'running',
      date: 'em andamento',
      contract: { sup: 'Base Forte Fundações', stageName: 'Fundação', value: 186000, status: 'Protegido', m: 'm1' }
    },
    { key: 'estrutura', name: 'Vedação e estrutura (EPS / Steel frame)', status: 'waiting', date: 'out' },
    { key: 'cobertura', name: 'Cobertura e telhado', status: 'waiting', date: 'nov' },
    { key: 'instalacoes', name: 'Instalações elétricas e hidráulicas', status: 'waiting', date: 'dez' },
    { key: 'esquadrias', name: 'Portas e esquadrias', status: 'waiting', date: 'jan' },
    { key: 'acabamento', name: 'Acabamentos e revestimentos', status: 'waiting', date: 'fev' },
    {
      key: 'projeto',
      name: 'Projeto aprovado',
      status: 'done',
      date: '12 ago',
      contract: { sup: 'Traço Arquitetura', stageName: 'Projeto', value: 68000, status: 'Pago', m: 'm3' }
    },
    { key: 'paisagismo', name: 'Paisagismo', status: 'waiting', date: 'mar' },
    { key: 'posobra', name: 'Limpeza e pós-obra', status: 'waiting', date: 'abr' }
  ]
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // 1. Respostas de fornecedores
  {
    id: 'notif-1',
    category: 'supplier_reply',
    title: 'Nova proposta de fundação recebida',
    description: 'Base Forte Fundações enviou proposta técnica com cronograma detalhado e pagamento em 3 etapas para sua obra em Atibaia.',
    time: 'há 15 min',
    timestamp: nowInit - 15 * 60 * 1000,
    read: false,
    badge: 'Proposta R$ 186.000',
    icon: 'orc',
    avatar: 'm1',
    supplierName: 'Base Forte Fundações',
    actionScreen: 'chat:c1',
    actionLabel: 'Ver proposta e detalhes'
  },
  {
    id: 'notif-2',
    category: 'supplier_reply',
    title: 'Visita técnica agendada',
    description: 'Painel Monolítico EPS respondeu sua mensagem e confirmou a visita ao terreno nesta quinta-feira às 9h.',
    time: 'Hoje 09:30',
    timestamp: nowInit - 3 * 3600 * 1000,
    read: false,
    badge: 'Mensagem',
    icon: 'msg',
    avatar: 'm9',
    supplierName: 'Painel Monolítico EPS',
    actionScreen: 'chat:c2',
    actionLabel: 'Abrir conversa'
  },
  {
    id: 'notif-3',
    category: 'supplier_reply',
    title: 'Projeto e memorial aprovados',
    description: 'Traço Arquitetura concluiu a aprovação na prefeitura e anexou os arquivos em PDF e DWG na sua obra.',
    time: 'Ontem',
    timestamp: nowInit - 26 * 3600 * 1000,
    read: true,
    badge: 'Documentos',
    icon: 'doc',
    avatar: 'm3',
    supplierName: 'Traço Arquitetura',
    actionScreen: 'chat:c3',
    actionLabel: 'Ver documentos'
  },

  // 2. Novos fornecedores
  {
    id: 'notif-4',
    category: 'new_supplier',
    title: 'Novo fornecedor em Atibaia e região',
    description: 'Steel Frame Brasil se credenciou na OFIR! Estruturas industrializadas leves, rapidez na montagem e alta eficiência térmica.',
    time: 'Hoje 08:00',
    timestamp: nowInit - 5 * 3600 * 1000,
    read: false,
    badge: 'Novo Fornecedor',
    icon: 'building',
    avatar: 'm8',
    supplierName: 'Steel Frame Brasil',
    actionScreen: 'sup:Steel Frame Brasil',
    actionLabel: 'Conhecer fornecedor'
  },
  {
    id: 'notif-5',
    category: 'new_supplier',
    title: 'Fornecedor homologado: Vidros & Esquadrias Alpha',
    description: 'Novo especialista em esquadrias de alumínio linha Gold e pele de vidro disponível com garantia estendida de 5 anos.',
    time: 'Ontem',
    timestamp: nowInit - 28 * 3600 * 1000,
    read: false,
    badge: 'Esquadrias',
    icon: 'building',
    avatar: 'm5',
    supplierName: 'Vidros & Esquadrias Alpha',
    actionScreen: 'sup:Vidros & Esquadrias Alpha',
    actionLabel: 'Ver catálogo e preços'
  },
  {
    id: 'notif-6',
    category: 'new_supplier',
    title: 'Ecopaineis Térmicos & Acústicos',
    description: 'Novo fornecedor credenciado para sistemas térmicos e acústicos em paredes e lajes.',
    time: '2 dias atrás',
    timestamp: nowInit - 50 * 3600 * 1000,
    read: true,
    badge: 'Novo Fornecedor',
    icon: 'building',
    avatar: 'm7',
    supplierName: 'Ecopaineis Térmicos & Acústicos',
    actionScreen: 'fornecedores',
    actionLabel: 'Ver fornecedores'
  },

  // 3. Novidades da plataforma
  {
    id: 'notif-7',
    category: 'platform_news',
    title: 'Novidade: Análise de Projeto Arquitetônico com IA',
    description: 'Faça upload da planta em PDF para extrair áreas, estimar custos preliminares e gerar checklist automático de contratação.',
    time: 'Hoje',
    timestamp: nowInit - 2 * 3600 * 1000,
    read: false,
    badge: 'Nova Ferramenta',
    icon: 'sparkles',
    avatar: 'm2',
    actionScreen: 'analise-projeto',
    actionLabel: 'Testar Análise com IA'
  },
  {
    id: 'notif-8',
    category: 'platform_news',
    title: 'Garantia de Resposta em 72h para Cotações',
    description: 'Agora seus pedidos de orçamento contam com SLA oficial OFIR: contagem regressiva de 72h e suporte prioritário.',
    time: 'Ontem',
    timestamp: nowInit - 30 * 3600 * 1000,
    read: true,
    badge: 'Garantia OFIR',
    icon: 'shield',
    avatar: 'm1',
    actionScreen: 'cotacoes',
    actionLabel: 'Ver cotações ativas'
  },
  {
    id: 'notif-9',
    category: 'platform_news',
    title: 'Pagamento Protegido por Etapa Concluída (Escrow)',
    description: 'Contratos fechados pela plataforma contam com proteção total: o dinheiro fica protegido e só é liberado após seu aval da entrega.',
    time: '3 dias atrás',
    timestamp: nowInit - 72 * 3600 * 1000,
    read: true,
    badge: 'Segurança',
    icon: 'checkDouble',
    avatar: 'm4',
    actionScreen: 'obra',
    actionLabel: 'Ver etapas da obra'
  }
];

let itemSeq = 1, quoteSeq = 1, orderSeq = 41, toastSeq = 1, convSeq = 4, addrSeq = 2, notifSeq = 10;

interface State {
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;

  authOpen: boolean;
  authView: 'login' | 'signup' | 'forgot' | 'sent';
  pending: (() => void) | null;
  openAuth: (view?: 'login' | 'signup' | 'forgot') => void;
  closeAuth: () => void;
  requireAuth: (fn: () => void) => void;

  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;

  filters: Filters;
  setFilters: (p: Partial<Filters>) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;

  obra: Obra;
  updateObra: (patch: Partial<Obra>) => void;
  setStageStatus: (key: string, status: 'done' | 'running' | 'waiting', date?: string) => void;
  advanceStage: (key: string) => void;

  addresses: Address[];
  addrSel: string | null;
  address: { cep: string; city: string } | null;
  setAddress: (a: { cep: string; city: string } | null) => void;
  addAddress: (a: Omit<Address, 'id'>) => Address;
  updateAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string | null) => void;

  orcName: string;
  setOrcName: (n: string) => void;
  items: OrcItem[];
  addItem: (it: Omit<OrcItem, 'id'>) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;

  conversations: Conversation[];
  proposals: Record<string, Proposal>;
  sent: Record<string, string>; // supName -> convId
  sendMessage: (convId: string, text: string) => void;
  addFile: (convId: string, file: { name: string; size: string }) => void;
  acceptProposal: (propId: string) => void;
  startQuote: (sup: Supplier, ask?: boolean, attach?: QuoteAttachment) => string;

  quotes: Quote[];
  requestQuotes: (sups: Supplier[]) => string;
  requestQuote: (sups: Supplier[]) => string;
  cancelQuote: (quoteId: string, reason?: string) => void;
  deleteQuote: (quoteId: string) => void;

  projectAnalyses: ProjectAnalysis[];
  saveAnalysis: (a: ProjectAnalysis) => void;
  removeAnalysis: (id: string) => void;
  toggleChecklistItem: (aid: string, itemId: string) => void;
  toggleChecklistSupplier: (aid: string, itemId: string, sup: string) => void;
  setAllChecklist: (aid: string, checked: boolean, kind?: 'svc' | 'mat') => void;
  sendChecklistQuotes: (aid: string) => string | null;

  orders: Order[];
  lastCheckout: { pay: string; orders: Order[] } | null;
  setLastCheckout: (lc: { pay: string; orders: Order[] } | null) => void;
  confirmOrder: (orderId: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  checkout: (method: string) => Order[];

  toasts: Toast[];
  toast: (title: string, text?: string) => void;
  dismissToast: (id: number) => void;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'time'> & { id?: string; time?: string; timestamp?: number; read?: boolean }) => void;
}

export const INITIAL_USER: User = {
  name: 'Eduardo Castro',
  email: 'eduardo@ofir.com.br',
  role: 'owner',
  phone: '(11) 98765-4321',
  cpfCnpj: '123.456.789-00',
  city: 'Atibaia',
  uf: 'SP',
  bio: 'Construindo casa térrea de 420m² em Atibaia utilizando sistemas modernos e sustentáveis.'
};

export const useStore = create<State>((set, get) => ({
  user: INITIAL_USER,
  signIn: u => {
    set(s => ({
      user: {
        ...(s.user || INITIAL_USER),
        ...u
      },
      authOpen: false
    }));
    const p = get().pending;
    set({ pending: null });
    p?.();
  },
  signOut: () => set({ user: null }),
  updateUser: patch => set(s => ({
    user: s.user ? { ...s.user, ...patch } : null
  })),

  authOpen: false,
  authView: 'login',
  pending: null,
  openAuth: (view = 'login') => set({ authOpen: true, authView: view }),
  closeAuth: () => set({ authOpen: false, pending: null }),
  requireAuth: fn => {
    if (get().user) fn();
    else set({ pending: fn, authOpen: true, authView: 'login' });
  },

  theme: 'light',
  setTheme: theme => set({ theme }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

  filters: defaultFilters,
  setFilters: p => set(s => ({ filters: { ...s.filters, ...p } })),
  viewMode: 'grid',
  setViewMode: viewMode => set({ viewMode }),

  obra: INITIAL_OBRA,
  updateObra: patch => set(s => ({ obra: { ...s.obra, ...patch } })),
  setStageStatus: (key, status, date) => set(s => {
    const stages = s.obra.stages.map(st => {
      if (st.key === key) {
        return {
          ...st,
          status,
          date: date || (status === 'done' ? today() : status === 'running' ? 'em andamento' : 'a iniciar')
        };
      }
      return st;
    });
    return { obra: { ...s.obra, stages } };
  }),
  advanceStage: key => set(s => {
    const stages = s.obra.stages.map(st => {
      if (st.key === key) {
        const nextStatus: ObraStage['status'] = st.status === 'waiting' ? 'running' : st.status === 'running' ? 'done' : 'waiting';
        return {
          ...st,
          status: nextStatus,
          date: nextStatus === 'done' ? today() : nextStatus === 'running' ? 'em andamento' : 'a iniciar'
        };
      }
      return st;
    });
    return { obra: { ...s.obra, stages } };
  }),

  addresses: INITIAL_ADDRS,
  addrSel: 'a1',
  address: { cep: '12940-000', city: 'Atibaia' },
  setAddress: a => {
    if (a) {
      set(s => ({
        address: a,
        addresses: s.addresses.map(x => x.id === s.addrSel ? { ...x, cep: a.cep || x.cep, city: a.city || x.city } : x)
      }));
    } else {
      set({ address: null });
    }
  },
  addAddress: a => {
    const na: Address = { ...a, id: 'a' + addrSeq++ };
    set(s => ({ addresses: [...s.addresses, na], addrSel: na.id }));
    get().toast(`Endereço salvo`, `${na.label} · ${na.city}/${na.uf}`);
    return na;
  },
  updateAddress: a => {
    set(s => ({ addresses: s.addresses.map(x => (x.id === a.id ? a : x)) }));
    get().toast(`Endereço atualizado`, `${a.label} · ${a.city}/${a.uf}`);
  },
  deleteAddress: id => {
    set(s => ({
      addresses: s.addresses.filter(x => x.id !== id),
      addrSel: s.addrSel === id ? (s.addresses.find(x => x.id !== id)?.id || null) : s.addrSel
    }));
  },
  selectAddress: id => {
    const a = get().addresses.find(x => x.id === id);
    set({ addrSel: id, address: a ? { cep: a.cep, city: a.city } : null });
    if (a) get().toast(`Entregando em ${a.label}`, `${a.city}/${a.uf}`);
  },

  orcName: 'Orçamento da obra',
  setOrcName: orcName => set({ orcName }),
  items: [],
  addItem: it => {
    set(s => {
      const same = s.items.find(i => i.kind === 'mat' && it.kind === 'mat' && i.sup === it.sup && i.n === it.n);
      if (same) return { items: s.items.map(i => (i === same ? { ...i, qty: i.qty + it.qty } : i)) };
      return { items: [...s.items, { id: 'i' + itemSeq++, ...it }] };
    });
    get().toast('Adicionado ao orçamento', `${it.n} · ${it.sup}`);
  },
  setQty: (id, qty) => set(s => ({ items: s.items.map(i => (i.id === id ? { ...i, qty: Math.max(1, qty || 1) } : i)) })),
  removeItem: id => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  clearItems: () => set({ items: [] }),

  conversations: INITIAL_CONVS,
  proposals: INITIAL_PROPS,
  sent: { 'Base Forte Fundações': 'c1', 'Painel Monolítico EPS': 'c2', 'Traço Arquitetura': 'c3' },

  sendMessage: (convId, text) => {
    const time = nowH();
    set(s => ({
      conversations: s.conversations.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c, time,
          msgs: [...c.msgs, { t: 'me', x: text, h: time }]
        };
      })
    }));
  },

  addFile: (convId, file) => {
    const time = nowH();
    set(s => ({
      conversations: s.conversations.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c, time,
          msgs: [...c.msgs, { t: 'file', name: file.name, size: file.size, h: time, me: true }]
        };
      })
    }));
    get().toast('Arquivo anexado', file.name);
  },

  acceptProposal: propId => {
    const prop = get().proposals[propId];
    if (!prop) return;
    const tot = prop.rows.reduce((a, r) => a + r[1], 0);
    const conv = get().conversations.find(c => c.id === prop.conv);
    set(s => {
      let stages = s.obra.stages;
      if (conv?.stage) {
        stages = stages.map(st => {
          if (st.key === conv.stage) {
            return {
              ...st,
              status: 'running' as const,
              date: 'contratada',
              contract: {
                sup: conv.n,
                stageName: st.name,
                value: tot,
                status: 'Protegido' as const,
                m: conv.m
              }
            };
          }
          return st;
        });
      }
      return {
        proposals: { ...s.proposals, [propId]: { ...prop, status: 'paid' } },
        obra: { ...s.obra, stages }
      };
    });
    get().toast('Proposta aceita e paga', `${prop.title} · ${BRL_FMT(tot)} protegido`);
  },

  startQuote: (x, ask = true, attach) => {
    const existing = get().sent[x.n];
    if (existing) return existing;
    const id = 'c' + convSeq++;
    const time = nowH();
    const nowTimestamp = Date.now();
    const area = get().obra.area || 420;
    const withProject: Message[] = attach
      ? [
          { t: 'sys', x: `Pedido de orçamento enviado · ${stageName(x.e)} · ${get().obra.name} ${area} m²` },
          ...(attach.file ? [{ t: 'file' as const, name: attach.file.name, size: attach.file.size, h: time, me: true }] : []),
          ...(attach.items?.length ? [{ t: 'me' as const, x: `Checklist gerado pela IA OFIR a partir do projeto. Itens para orçamento: ${attach.items.join(' · ')}`, h: time }] : []),
          { t: 'sys', x: 'Prazo de 72 horas iniciado para o fornecedor enviar o orçamento' },
          { t: 'them', x: attach.file ? 'Olá! Recebemos o projeto arquitetônico e o checklist. Vamos analisar e enviar o orçamento dentro do prazo.' : 'Olá! Recebemos o checklist da sua obra. Se tiver o projeto em PDF, pode anexar por aqui para um orçamento mais preciso.', h: time }
        ]
      : [];
    const newConv: Conversation = {
      id, n: x.n, m: x.m, e: stageName(x.e), stage: x.e, area, unread: 0, time,
      createdAt: nowTimestamp,
      deadlineAt: nowTimestamp + 72 * 3600 * 1000,
      awaiting: ask,
      msgs: attach
        ? withProject
        : ask
        ? [
            { t: 'sys', x: `Pedido de orçamento enviado · ${stageName(x.e)} · Casa 420 m²` },
            { t: 'sys', x: 'Prazo de 72 horas iniciado para o fornecedor enviar o orçamento' },
            { t: 'them', x: 'Olá! Recebemos seu pedido. Para cotar com precisão, envie o projeto arquitetônico por aqui.', h: time },
            { t: 'ask' }
          ]
        : [
            { t: 'sys', x: 'Conversa iniciada pelo perfil do fornecedor' },
            { t: 'them', x: 'Olá! Como podemos ajudar na sua obra? Se já tiver o projeto, pode anexar por aqui.', h: time }
          ]
    };
    set(s => ({
      conversations: [newConv, ...s.conversations],
      sent: { ...s.sent, [x.n]: id }
    }));
    return id;
  },

  quotes: [],
  requestQuotes: sups => {
    const qid = 'COT-' + String(quoteSeq++).padStart(3, '0');
    const label = [...new Set(sups.map(x => stageName(x.e)))].join(' + ');
    const items: QuoteItem[] = [];

    sups.forEach(x => {
      let cid = get().sent[x.n];
      if (!cid) cid = get().startQuote(x, true);
      items.push({ sup: x.n, conv: cid });
    });

    const newQuote: Quote = {
      id: qid,
      label,
      created: today(),
      createdAtMs: Date.now(),
      items,
      sups: sups.map(x => x.n),
      status: 'Analisando o projeto'
    };
    set(s => ({ quotes: [newQuote, ...s.quotes] }));
    get().toast('Cotação enviada', `Pedido enviado para ${sups.length} fornecedores.`);
    return qid;
  },
  requestQuote: sups => get().requestQuotes(sups),
  cancelQuote: (qid, reason) => {
    const q = get().quotes.find(x => x.id === qid);
    if (!q) return;
    set(s => ({
      quotes: s.quotes.map(x => x.id !== qid ? x : {
        ...x,
        status: 'Cancelada pelo cliente',
        cancelled: true,
        cancelReason: reason || 'Desistência em até 24h'
      })
    }));
    const time = nowH();
    (q.items || []).forEach(it => {
      if (it.conv) {
        set(s => ({
          conversations: s.conversations.map(c => c.id !== it.conv ? c : {
            ...c, time,
            msgs: [...c.msgs, { t: 'sys', x: `Cotação ${qid} cancelada pelo cliente (desistência em 24h).` }]
          })
        }));
      }
    });
    get().toast('Cotação cancelada', `A solicitação ${qid} foi cancelada sem taxas.`);
  },
  deleteQuote: qid => {
    set(s => ({
      quotes: s.quotes.filter(x => x.id !== qid),
      projectAnalyses: s.projectAnalyses.map(a => a.quoteId === qid ? { ...a, quoteId: undefined } : a)
    }));
    get().toast('Cotação excluída', 'A cotação foi removida com sucesso.');
  },

  projectAnalyses: [],
  saveAnalysis: a => set(s => ({ projectAnalyses: [a, ...s.projectAnalyses.filter(x => x.id !== a.id)] })),
  removeAnalysis: id => set(s => ({ projectAnalyses: s.projectAnalyses.filter(x => x.id !== id) })),
  toggleChecklistItem: (aid, itemId) => set(s => ({
    projectAnalyses: s.projectAnalyses.map(a => a.id !== aid ? a : {
      ...a,
      items: a.items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it)
    })
  })),
  toggleChecklistSupplier: (aid, itemId, sup) => set(s => ({
    projectAnalyses: s.projectAnalyses.map(a => a.id !== aid ? a : {
      ...a,
      items: a.items.map(it => {
        if (it.id !== itemId) return it;
        const has = it.selected.includes(sup);
        const selected = has ? it.selected.filter(n => n !== sup) : [...it.selected, sup];
        return { ...it, selected, checked: selected.length > 0 ? true : it.checked };
      })
    })
  })),
  setAllChecklist: (aid, checked, kind) => set(s => ({
    projectAnalyses: s.projectAnalyses.map(a => a.id !== aid ? a : {
      ...a,
      items: a.items.map(it => (!kind || it.kind === kind) && it.suppliers.length ? { ...it, checked } : it)
    })
  })),
  sendChecklistQuotes: aid => {
    const a = get().projectAnalyses.find(x => x.id === aid);
    if (!a) return null;
    // agrupa os itens marcados por fornecedor selecionado
    const bySup = new Map<string, string[]>();
    a.items.filter(it => it.checked).forEach(it => {
      it.selected.forEach(n => {
        if (!bySup.has(n)) bySup.set(n, []);
        bySup.get(n)!.push(it.qty && it.un ? `${it.title} (${it.qty.toLocaleString('pt-BR')} ${it.un})` : it.title);
      });
    });
    const sups = [...bySup.keys()].map(n => SUPPLIERS.find(x => x.n === n)).filter(Boolean) as Supplier[];
    if (!sups.length) return null;

    const file = a.fileName ? { name: a.fileName, size: a.fileSize || '' } : undefined;
    const time = nowH();
    const items: QuoteItem[] = sups.map(x => {
      const lines = bySup.get(x.n) || [];
      const existing = get().sent[x.n];
      if (existing) {
        // conversa já existe: anexa o projeto e o checklist nela
        set(s => ({
          conversations: s.conversations.map(c => c.id !== existing ? c : {
            ...c, time,
            msgs: [
              ...c.msgs.filter(m => m.t !== 'ask'),
              ...(file ? [{ t: 'file' as const, name: file.name, size: file.size, h: time, me: true }] : []),
              { t: 'me' as const, x: `Checklist gerado pela IA OFIR a partir do projeto. Itens para orçamento: ${lines.join(' · ')}`, h: time }
            ]
          })
        }));
        return { sup: x.n, conv: existing };
      }
      return { sup: x.n, conv: get().startQuote(x, true, { file, items: lines }) };
    });

    const checkedCats = [...new Set(a.items.filter(it => it.checked && it.selected.length).map(it => stageName(it.cat)))];
    const qid = 'COT-' + String(quoteSeq++).padStart(3, '0');
    const newQuote: Quote = {
      id: qid,
      label: `Checklist do projeto · ${checkedCats.slice(0, 3).join(' + ')}${checkedCats.length > 3 ? ` +${checkedCats.length - 3}` : ''}`,
      created: today(),
      createdAtMs: Date.now(),
      items,
      sups: sups.map(x => x.n),
      status: file ? 'Projeto enviado aos fornecedores' : 'Checklist enviado aos fornecedores'
    };
    set(s => ({
      quotes: [newQuote, ...s.quotes],
      projectAnalyses: s.projectAnalyses.map(x => x.id === aid ? { ...x, quoteId: qid, sentAt: Date.now() } : x)
    }));
    get().toast('Solicitações enviadas', `${sups.length} fornecedores receberam ${file ? 'o projeto e ' : ''}o checklist.`);
    return qid;
  },

  orders: INITIAL_ORDERS,
  lastCheckout: null,
  setLastCheckout: lastCheckout => set({ lastCheckout }),
  checkout: method => {
    const { items, addresses, addrSel, user } = get();
    const curA = addresses.find(a => a.id === addrSel) || addresses[0] || INITIAL_ADDRS[0];
    const city = curA?.city || '';
    const gs = groupsOf(items, city).filter(g => g.ok);
    const pay = 'PAG-2026-' + String(orderSeq++).padStart(5, '0');
    const createdOrders: Order[] = gs.map(g => {
      const hasMat = g.items.some(i => i.kind === 'mat');
      return {
        id: 'PED-2026-' + String(orderSeq++).padStart(5, '0'),
        pay,
        sup: g.sup,
        total: g.total,
        sub: g.sub,
        frete: g.frete,
        fee: Math.round(g.total * PLATFORM_FEE),
        created: today(),
        createdAtMs: Date.now(),
        method,
        status: hasMat ? 'Aguardando entrega' : 'Etapa 1 em andamento',
        release: hasMat
          ? 'Valor liberado ao fornecedor quando você confirmar a entrega'
          : 'Valor liberado por etapa concluída após sua confirmação',
        done: false,
        hasMat,
        items: g.items.map(i => ({ ...i })),
        addr: { ...curA },
        client: user ? user.name : 'Você'
      };
    });
    const paid = new Set(gs.map(g => g.sup));
    set(s => ({
      orders: [...createdOrders, ...s.orders],
      items: s.items.filter(i => !paid.has(i.sup)),
      lastCheckout: { pay, orders: createdOrders }
    }));
    get().toast('Compra finalizada', `${createdOrders.length} ${createdOrders.length > 1 ? 'pedidos criados' : 'pedido criado'}`);
    return createdOrders;
  },
  cancelOrder: (orderId, reason) => {
    const o = get().orders.find(x => x.id === orderId);
    if (!o) return;
    set(s => ({
      orders: s.orders.map(x => x.id !== orderId ? x : {
        ...x,
        status: 'Cancelado · Reembolsado',
        release: `R$ ${x.total.toLocaleString('pt-BR')} estornado ao cliente integralmente (desistência em 24h)`,
        done: false,
        cancelled: true,
        cancelReason: reason || 'Desistência em até 24h'
      })
    }));
    const conv = get().conversations.find(c => c.n === o.sup);
    if (conv) {
      const time = nowH();
      set(s => ({
        conversations: s.conversations.map(c => c.id !== conv.id ? c : {
          ...c, time,
          msgs: [...c.msgs, { t: 'sys', x: `Pedido ${orderId} cancelado pelo cliente dentro da garantia de 24h. Reembolso integral aprovado.` }]
        })
      }));
    }
    get().toast('Pedido cancelado', `Reembolso de R$ ${o.total.toLocaleString('pt-BR')} aprovado sem taxas.`);
  },
  confirmOrder: orderId => {
    const todayStr = today();
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== orderId) return o;
        const fee = Math.round(o.total * PLATFORM_FEE);
        const net = o.total - fee;
        return {
          ...o,
          done: true,
          status: o.hasMat ? 'Entregue' : 'Concluído',
          release: `R$ ${net.toLocaleString('pt-BR')} liberado ao fornecedor em ${todayStr}`
        };
      })
    }));
    const o = get().orders.find(x => x.id === orderId);
    get().toast(o?.hasMat ? 'Entrega confirmada' : 'Conclusão confirmada', `Pagamento liberado para ${o?.sup || 'o fornecedor'}.`);
  },

  toasts: [],
  toast: (title, text) => {
    const id = toastSeq++;
    set(s => ({ toasts: [...s.toasts, { id, title, text }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  notifications: INITIAL_NOTIFICATIONS,
  addNotification: notif => {
    const id = notif.id || 'notif-' + notifSeq++;
    const timestamp = notif.timestamp || Date.now();
    const time = notif.time || nowH();
    const newNotif: AppNotification = {
      ...notif,
      id,
      timestamp,
      time,
      read: notif.read ?? false
    };
    set(s => ({
      notifications: [newNotif, ...s.notifications]
    }));
  },
  markNotificationAsRead: id => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },
  markAllNotificationsAsRead: () => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true }))
    }));
    get().toast('Notificações atualizadas', 'Todas as notificações foram marcadas como lidas.');
  },
  removeNotification: id => {
    set(s => ({
      notifications: s.notifications.filter(n => n.id !== id)
    }));
  },
  clearAllNotifications: () => {
    set(s => ({
      notifications: []
    }));
    get().toast('Notificações limpas');
  }
}));

const BRL_FMT = (v: number) => 'R$ ' + v.toLocaleString('pt-BR');

export const useOrc = () => {
  const items = useStore(s => s.items);
  const addresses = useStore(s => s.addresses);
  const addrSel = useStore(s => s.addrSel);
  const curA = addresses.find(a => a.id === addrSel);
  const city = curA?.city || '';
  const groups = groupsOf(items, city);
  return { items, groups, totals: totalsOf(groups), curAddress: curA };
};
