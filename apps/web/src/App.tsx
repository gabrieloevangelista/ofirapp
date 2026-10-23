import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BRL, BRLc, ICONS, PLANS, STAGES, STAGE_COUNT, SUPPLIERS, SYSTEMS, STANDARDS,
  catOf, filterSuppliers, filterSummary, getSupplierDetails, initials, rate,
  segList, simulate, stageName, sysName, useOrc, useStore,
  calcObraProgress, calcQuoteCountdown, calc24hCancellation,
  LEGAL_PILLARS, TERMS_OF_USE_TEXT, PRIVACY_POLICY_TEXT,
  type Supplier, type ServiceItem, type Message, type Conversation, type Obra, type ObraStage,
  type AppNotification, type NotificationCategory
} from '@ofirapp/core';
import { CustomSelect } from './components/CustomSelect';
import { ProjectAnalyzer } from './components/ProjectAnalyzer';
import { SupplierPortal } from './components/SupplierPortal';
import { BRAZIL_UFS, fetchCitiesByUf, TOP_CITIES_BY_UF } from './data/brazilLocations';


/* ---------- SVG Helper ---------- */
const Svg = ({ k, s = 18, c, color, sw = 2 }: { k: string; s?: number; c?: string; color?: string; sw?: number }) => {
  const d = ICONS[k];
  if (!d) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color || c || 'currentColor'} strokeWidth={s > 30 ? 1.4 : sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};
const Icon = Svg;

const CHECK_BADGE = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-label="Verificado" style={{ color: 'var(--accent)', marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1 3 1 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1L2.7 15.5l1-3-1-3 2.8-1.6.9-3.1 3.2.3z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" fill="none" />
  </svg>
);

const STAR_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
  </svg>
);

const LogoIcon = () => (
  <i>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2ZM12 6.5L7.5 9.1V14.9L12 17.5L16.5 14.9V9.1L12 6.5Z" fill="#fff" />
      <circle cx="12" cy="12" r="1.8" fill="#10b981" />
    </svg>
  </i>
);

type ScreenView = null | 'obra' | 'msgs' | 'orc' | 'checkout' | 'paid' | 'hist' | 'enderecos' | 'perfil' | 'config' | 'cotacoes' | 'analise-projeto' | 'notificacoes' | 'termos' | 'privacidade' | 'conformidade' | 'sobre' | `cotacao:${string}` | `chat:${string}` | `ped:${string}`;

/* ---------- Componente: Relógio / SLA de 72 horas para Cotações ---------- */
function WebQuoteCountdown({ conv }: { conv: Conversation }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cd = calcQuoteCountdown(conv, now);

  if (cd.hasProposal) {
    return (
      <div className="quote-clock-banner success">
        <div className="quote-clock-header">
          <div className="quote-clock-title-box">
            <span className="quote-clock-icon">
              <Svg k="check" s={16} />
            </span>
            <div>
              <strong style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>Orçamento recebido dentro do prazo</strong>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>SLA OFIR cumprido pelo fornecedor</span>
            </div>
          </div>
          <span className="quote-clock-badge">72h Atendido</span>
        </div>
        <p className="quote-clock-desc">
          O fornecedor enviou a proposta técnica e de pagamento dentro da janela de 72 horas.
        </p>
      </div>
    );
  }

  if (cd.isExpired) {
    return (
      <div className="quote-clock-banner expired">
        <div className="quote-clock-header">
          <div className="quote-clock-title-box">
            <span className="quote-clock-icon">
              <Svg k="clock" s={16} />
            </span>
            <div>
              <strong style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>Prazo de 72h finalizado</strong>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Aguardando retorno do fornecedor</span>
            </div>
          </div>
          <span className="quote-clock-badge">Tempo esgotado</span>
        </div>
        <p className="quote-clock-desc">
          O prazo padrão de 72h para envio do orçamento encerrou. Você pode cobrar retorno ou consultar outros fornecedores.
        </p>
      </div>
    );
  }

  return (
    <div className="quote-clock-banner">
      <div className="quote-clock-header">
        <div className="quote-clock-title-box">
          <span className="quote-clock-icon">
            <Svg k="clock" s={16} />
          </span>
          <div>
            <strong style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>Prazo para envio do orçamento</strong>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>SLA OFIR · Janela de até 72 horas</span>
          </div>
        </div>
        <div className="quote-clock-digits-box">
          <span className="quote-clock-digits">{cd.formattedTime}</span>
          <span className="quote-clock-digits-label">({cd.formattedText})</span>
        </div>
      </div>
      <div className="quote-clock-bar-bg" title={`${Math.round(cd.progressPercent)}% do prazo restante`}>
        <div className="quote-clock-bar-fill" style={{ width: `${cd.progressPercent}%` }}></div>
      </div>
      <p className="quote-clock-desc">
        O fornecedor recebeu a solicitação e tem até 72 horas para analisar o projeto e formular a cotação. Acompanhe a contagem em tempo real.
      </p>
    </div>
  );
}

const SYSTEM_IMAGES: Record<string, string> = {
  alvenaria: '/casa_alvenaria_convencional.png',
  bloco: '/casa_alvenaria_estrutural.png',
  eps: '/casa_painel_monolitico.png',
  steel: '/casa_steel_frame_clean.png',
  wood: '/casa_alto_padrao_wood_frame.png',
  metalica: '/casa_estrutura_metalica.png',
  acabada: '/casa_acabada.png',
  premoldado: '/systems/premoldado.jpg',
};

interface StandardInfo {
  idx: number;
  name: string;
  tag: string;
  label: string;
  img: string;
  desc: string;
  m2Ref: string;
}

const STANDARD_INFO: StandardInfo[] = [
  {
    idx: 0,
    name: 'Médio',
    tag: 'Padrão 1',
    label: 'Padrão Médio',
    img: '/type/1.jpg',
    desc: 'Construção contemporânea com acabamentos essenciais de excelente qualidade e ótimo custo-benefício.',
    m2Ref: 'Média R$ 2.900/m²',
  },
  {
    idx: 1,
    name: 'Médio-Alto',
    tag: 'Padrão 2',
    label: 'Padrão Médio-Alto',
    img: '/type/2.jpg',
    desc: 'Fachada contemporânea com detalhes em pedra e ripados, porcelanatos nobres e ampla integração.',
    m2Ref: 'Média R$ 4.200/m²',
  },
  {
    idx: 2,
    name: 'Alto Padrão',
    tag: 'Padrão 3',
    label: 'Alto Padrão',
    img: '/type/3.jpg',
    desc: 'Grandes vãos envidraçados, mármores nobres, área gourmet completa e piscina privativa.',
    m2Ref: 'Média R$ 6.200/m²',
  },
  {
    idx: 3,
    name: 'Alto Luxo',
    tag: 'Padrão 4',
    label: 'Alto Luxo',
    img: '/type/4.jpg',
    desc: 'Arquitetura autoral inovadora, balanços estruturais, piscina com borda infinita e acabamento refinado.',
    m2Ref: 'Média R$ 8.800/m²',
  },
  {
    idx: 4,
    name: 'Ultra Luxo',
    tag: 'Padrão 5',
    label: 'Ultra Luxo',
    img: '/type/5.jpg',
    desc: 'Propriedade monumental exclusiva, grandes vãos, mármores nobres importados, esquadrias minimalistas e altíssimo padrão construtivo.',
    m2Ref: 'R$ 9.000 a R$ 20.000+ (Média R$ 14.500/m²)',
  },
];

export default function App() {
  const {
    user, signOut, openAuth, authOpen, authView, closeAuth, signIn, requireAuth, updateUser,
    theme, toggleTheme,
    filters, setFilters, viewMode, setViewMode,
    addresses, addrSel, selectAddress, addAddress, updateAddress, deleteAddress, setAddress,
    orcName, setOrcName, addItem, setQty, removeItem, clearItems,
    conversations, proposals, sent, sendMessage, addFile, acceptProposal, startQuote,
    quotes, requestQuotes, orders, checkout, lastCheckout, confirmOrder,
    cancelOrder, cancelQuote, deleteQuote,
    toasts, toast, dismissToast,
    obra, updateObra, setStageStatus, advanceStage,
    notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
    removeNotification, clearAllNotifications
  } = useStore();

  const { items, groups, totals, curAddress } = useOrc();

  // Alternância de Perspectiva: Cliente (Obra) vs Fornecedor (Parceiros B2B)
  const [currentPortal, setCurrentPortal] = useState<'client' | 'supplier'>(() => {
    if (typeof window !== 'undefined') {
      if (
        window.location.hash === '#fornecedor' ||
        window.location.search.includes('portal=supplier') ||
        window.location.search.includes('portal=fornecedor')
      ) {
        return 'supplier';
      }
    }
    return 'client';
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#fornecedor') {
        setCurrentPortal('supplier');
      } else if (window.location.hash === '#cliente' || window.location.hash === '#obra') {
        setCurrentPortal('client');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Google One Tap integration
  const GOOGLE_CLIENT_ID: string | undefined = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (user || !GOOGLE_CLIENT_ID) return;

    const initGoogleOneTap = () => {
      const g = (window as any).google?.accounts?.id;
      if (!g) return;

      try {
        g.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (!response?.credential) return;
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              const userName = payload.name || payload.given_name || 'Usuário Google';
              const userEmail = payload.email || 'usuario@google.com';
              signIn({
                name: userName,
                email: userEmail,
                avatar: payload.picture,
                role: 'owner'
              });
              toast('Conta conectada com sucesso', `Bem-vindo à OFIR, ${userName}!`);
            } catch (err) {
              console.error('Falha ao decodificar token do Google', err);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        g.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.()) {
            console.log('Google One Tap não exibido:', notification.getNotDisplayedReason?.());
          }
        });
      } catch (err) {
        console.warn('Google One Tap error:', err);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleOneTap();
    } else {
      const t = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(t);
          initGoogleOneTap();
        }
      }, 500);
      return () => clearInterval(t);
    }
  }, [user, GOOGLE_CLIENT_ID]);

  // Notifications state
  const notifBellRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPopoverTab, setNotifPopoverTab] = useState<'all' | 'supplier_reply' | 'new_supplier' | 'platform_news'>('all');
  const [notifScreenTab, setNotifScreenTab] = useState<'all' | 'supplier_reply' | 'new_supplier' | 'platform_news' | 'unread'>('all');
  const [notifSearch, setNotifSearch] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifBellRef.current && !notifBellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Navigation & state
  const [activeScreen, setActiveScreen] = useState<ScreenView>(null);
  const [profileSup, setProfileSup] = useState<Supplier | null>(null);
  const [spotOpen, setSpotOpen] = useState(false);
  const [spotQuery, setSpotQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [selSet, setSelSet] = useState<Set<string>>(new Set());
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupRole, setSignupRole] = useState<'owner' | 'supplier'>('owner');
  const [signupName, setSignupName] = useState('Eduardo Castro');
  const [signupEmail, setSignupEmail] = useState('eduardo@ofir.com.br');
  const [signupPhone, setSignupPhone] = useState('(11) 98765-4321');
  const [signupPass, setSignupPass] = useState('12345678');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<'pix' | 'card' | 'boleto'>('pix');

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    setNotifOpen(false);
    if (!notif.actionScreen) return;

    if (notif.actionScreen.startsWith('chat:')) {
      setActiveScreen(notif.actionScreen as ScreenView);
    } else if (notif.actionScreen.startsWith('cotacao:')) {
      setActiveScreen(notif.actionScreen as ScreenView);
    } else if (notif.actionScreen.startsWith('sup:')) {
      const supName = notif.actionScreen.replace('sup:', '');
      openProfileByName(supName);
      setActiveScreen(null);
    } else if (notif.actionScreen === 'fornecedores') {
      setActiveScreen(null);
      document.getElementById('fornecedores')?.scrollIntoView({ behavior: 'smooth' });
    } else if (notif.actionScreen === 'analise-projeto') {
      setActiveScreen('analise-projeto');
    } else if (notif.actionScreen === 'cotacoes') {
      setActiveScreen('cotacoes');
    } else if (notif.actionScreen === 'obra') {
      setActiveScreen('obra');
    } else {
      setActiveScreen(notif.actionScreen as ScreenView);
    }
  };

  const simulateSupplierReply = () => {
    addNotification({
      category: 'supplier_reply',
      title: 'Nova mensagem de Base Forte Fundações',
      description: 'Olá Eduardo! Confirmamos o envio da sondagem e a liberação da equipe para o início da armação na segunda-feira.',
      badge: 'Mensagem',
      icon: 'msg',
      avatar: 'm1',
      supplierName: 'Base Forte Fundações',
      actionScreen: 'chat:c1',
      actionLabel: 'Abrir chat'
    });
    toast('Nova notificação', 'Resposta de fornecedor recebida.');
  };

  const simulateNewSupplier = () => {
    addNotification({
      category: 'new_supplier',
      title: 'Novo fornecedor: Engenharia Solar & Térmica',
      description: 'Novo especialista em energia fotovoltaica e aquecimento solar credenciado na sua cidade com condições exclusivas de lançamento.',
      badge: 'Novo Fornecedor',
      icon: 'building',
      avatar: 'm6',
      supplierName: 'Engenharia Solar & Térmica',
      actionScreen: 'fornecedores',
      actionLabel: 'Ver no catálogo'
    });
    toast('Nova notificação', 'Novo fornecedor credenciado.');
  };

  const simulatePlatformNews = () => {
    addNotification({
      category: 'platform_news',
      title: 'Novidade: Histórico de medições e laudos fotográficos',
      description: 'Agora você pode anexar fotos e diário de obras em cada etapa contratada para comprovação de qualidade.',
      badge: 'Atualização',
      icon: 'sparkles',
      avatar: 'm7',
      actionScreen: 'obra',
      actionLabel: 'Ver na Minha Obra'
    });
    toast('Nova notificação', 'Novidade da plataforma disponível.');
  };
  const [isPaying, setIsPaying] = useState(false);
  const [editingObra, setEditingObra] = useState(false);
  const [obraForm, setObraForm] = useState({ name: obra.name, area: obra.area, system: obra.system, city: obra.city, uf: obra.uf });

  // User profile & avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [userForm, setUserForm] = useState({
    name: user?.name || 'Eduardo Castro',
    email: user?.email || 'eduardo@ofir.com.br',
    phone: user?.phone || '(11) 98765-4321',
    cpfCnpj: user?.cpfCnpj || '123.456.789-00',
    cep: user?.cep || '12940-000',
    street: user?.street || 'Av. Lucas Nogueira Garcez',
    num: user?.num || '1250',
    comp: user?.comp || '',
    hood: user?.hood || 'Jardim do Lago',
    city: user?.city || 'Atibaia',
    uf: user?.uf || 'SP',
    role: user?.role || 'owner',
    bio: user?.bio || 'Construindo casa térrea de 420m² em Atibaia utilizando sistemas modernos e sustentáveis.',
    avatar: user?.avatar || ''
  });

  const [profileCepLoading, setProfileCepLoading] = useState(false);
  const [profileCepStatus, setProfileCepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [profileCepFeedback, setProfileCepFeedback] = useState('');
  const [profileCitiesList, setProfileCitiesList] = useState<string[]>(() => {
    return TOP_CITIES_BY_UF[user?.uf || 'SP'] || [];
  });
  const [profileLoadingCities, setProfileLoadingCities] = useState(false);

  useEffect(() => {
    if (user) {
      setUserForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '(11) 98765-4321',
        cpfCnpj: user.cpfCnpj || '123.456.789-00',
        cep: user.cep || '12940-000',
        street: user.street || 'Av. Lucas Nogueira Garcez',
        num: user.num || '1250',
        comp: user.comp || '',
        hood: user.hood || 'Jardim do Lago',
        city: user.city || 'Atibaia',
        uf: user.uf || 'SP',
        role: user.role || 'owner',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Carrega cidades da UF do perfil de forma assíncrona
  useEffect(() => {
    let active = true;
    const loadCities = async () => {
      if (!userForm.uf) {
        setProfileCitiesList([]);
        return;
      }
      const staticList = TOP_CITIES_BY_UF[userForm.uf] || [];
      setProfileCitiesList(staticList);
      setProfileLoadingCities(true);
      try {
        const remote = await fetchCitiesByUf(userForm.uf);
        if (active && remote.length > 0) {
          setProfileCitiesList(remote);
        }
      } catch (err) {
        console.warn('Erro ao carregar cidades da UF:', err);
      } finally {
        if (active) setProfileLoadingCities(false);
      }
    };
    loadCities();
    return () => { active = false; };
  }, [userForm.uf]);

  useEffect(() => {
    if (userForm.city && !profileCitiesList.includes(userForm.city)) {
      setProfileCitiesList(prev => [userForm.city, ...prev]);
    }
  }, [userForm.city, profileCitiesList]);

  // Consulta do CEP no perfil via ViaCEP
  const handleProfileCepLookup = async (digits: string) => {
    if (digits.length === 8) {
      setProfileCepLoading(true);
      setProfileCepStatus('loading');
      setProfileCepFeedback('Buscando endereço...');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const newStreet = data.logradouro || '';
          const newHood = data.bairro || '';
          const newCity = data.localidade || '';
          const newUf = data.uf || '';

          setUserForm(prev => ({
            ...prev,
            street: newStreet || prev.street,
            hood: newHood || prev.hood,
            city: newCity || prev.city,
            uf: newUf || prev.uf
          }));

          setProfileCepStatus('success');
          setProfileCepFeedback(`${newCity}/${newUf} localizado com sucesso`);

          setTimeout(() => {
            if (newStreet) {
              document.getElementById('profile-num')?.focus();
            } else {
              document.getElementById('profile-street')?.focus();
            }
          }, 60);
        } else {
          setProfileCepStatus('error');
          setProfileCepFeedback('CEP não encontrado. Preencha os campos abaixo.');
        }
      } catch (err) {
        console.error(err);
        setProfileCepStatus('error');
        setProfileCepFeedback('Não foi possível consultar o CEP.');
      } finally {
        setProfileCepLoading(false);
      }
    } else {
      setProfileCepStatus('idle');
      setProfileCepFeedback('');
    }
  };

  const handleProfileCepChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setUserForm(prev => ({ ...prev, cep: masked }));
    if (digits.length === 8) {
      handleProfileCepLookup(digits);
    } else {
      setProfileCepStatus('idle');
      setProfileCepFeedback('');
    }
  };

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 6) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 2) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    setUserForm(prev => ({ ...prev, phone: masked }));
  };

  const handleCpfCnpjChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    let masked = digits;
    if (digits.length <= 11) {
      if (digits.length > 9) {
        masked = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      } else if (digits.length > 6) {
        masked = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      } else if (digits.length > 3) {
        masked = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      }
    } else {
      if (digits.length > 12) {
        masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
      } else if (digits.length > 8) {
        masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      } else if (digits.length > 5) {
        masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      } else if (digits.length > 2) {
        masked = `${digits.slice(0, 2)}.${digits.slice(2)}`;
      }
    }
    setUserForm(prev => ({ ...prev, cpfCnpj: masked }));
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const base64 = ev.target?.result as string;
        setUserForm(prev => ({ ...prev, avatar: base64 }));
        updateUser({ avatar: base64 });
        toast('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setObraForm({ name: obra.name, area: obra.area, system: obra.system, city: obra.city, uf: obra.uf });
  }, [obra]);

  const [obraCitiesList, setObraCitiesList] = useState<string[]>(() => {
    return TOP_CITIES_BY_UF[obra.uf || 'SP'] || [];
  });
  const [obraLoadingCities, setObraLoadingCities] = useState(false);
  const [obraCep, setObraCep] = useState('');
  const [obraCepStatus, setObraCepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [obraCepFeedback, setObraCepFeedback] = useState('');

  const handleObraCepLookup = async (rawCep: string) => {
    const cleaned = rawCep.replace(/\D/g, '').slice(0, 8);
    const formatted = cleaned.length > 5 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : cleaned;
    setObraCep(formatted);

    if (cleaned.length !== 8) {
      setObraCepStatus('idle');
      setObraCepFeedback('');
      return;
    }

    setObraCepStatus('loading');
    setObraCepFeedback('Buscando localização da obra...');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();

      if (data.erro) {
        setObraCepStatus('error');
        setObraCepFeedback('CEP não encontrado.');
        return;
      }

      setObraCepStatus('success');
      setObraCepFeedback(`${data.localidade || ''}/${data.uf || ''}`);

      setObraForm(prev => ({
        ...prev,
        city: data.localidade || prev.city,
        uf: data.uf || prev.uf
      }));
    } catch {
      setObraCepStatus('error');
      setObraCepFeedback('Erro ao consultar CEP.');
    }
  };

  useEffect(() => {
    let active = true;
    const loadCities = async () => {
      if (!obraForm.uf) {
        setObraCitiesList([]);
        return;
      }
      const staticList = TOP_CITIES_BY_UF[obraForm.uf] || [];
      setObraCitiesList(staticList);
      setObraLoadingCities(true);
      try {
        const remote = await fetchCitiesByUf(obraForm.uf);
        if (active && remote.length > 0) {
          setObraCitiesList(remote);
        }
      } catch (err) {
        console.warn('Erro ao carregar cidades da obra:', err);
      } finally {
        if (active) setObraLoadingCities(false);
      }
    };
    loadCities();
    return () => { active = false; };
  }, [obraForm.uf]);

  useEffect(() => {
    if (obraForm.city && !obraCitiesList.includes(obraForm.city)) {
      setObraCitiesList(prev => [obraForm.city, ...prev]);
    }
  }, [obraForm.city, obraCitiesList]);

  const obraCityOptions = useMemo(() => {
    return obraCitiesList.map(c => ({ value: c, label: c }));
  }, [obraCitiesList]);

  // Obra dynamic calculation
  const obraProgress = calcObraProgress(obra.stages);
  const nextStage = obra.stages.find(s => s.status === 'waiting') || obra.stages.find(s => s.status === 'running');
  const activeStageIdx = obra.stages.findIndex(s => s.status === 'running');
  const widgetStartIdx = Math.max(0, Math.min(obra.stages.length - 4, activeStageIdx === -1 ? 0 : Math.max(0, activeStageIdx - 2)));
  const widgetStages = obra.stages.slice(widgetStartIdx, widgetStartIdx + 4);

  // Supplier contact & quote flow helpers
  const enterSupplierAndQuote = (sup: Supplier) => {
    const isNew = !sent[sup.n];
    const cid = startQuote(sup, true);
    if (isNew) {
      toast('Cotação solicitada', `Contato para cotação iniciado com ${sup.n}.`);
    }
    setActiveScreen(`chat:${cid}`);
  };

  const handleOpenChatFromSelbar = () => {
    const selectedSups = SUPPLIERS.filter(s => selSet.has(s.n));
    if (selectedSups.length === 0) return;
    const convIds: string[] = [];
    selectedSups.forEach(s => {
      const cid = startQuote(s, true);
      convIds.push(cid);
    });
    requestQuotes(selectedSups);
    setSelMode(false);
    setSelSet(new Set());
    if (selectedSups.length === 1) {
      setActiveScreen(`chat:${convIds[0]}`);
    } else {
      setActiveScreen('msgs');
    }
  };

  const handleRequestQuotesFromSelbar = () => {
    const selectedSups = SUPPLIERS.filter(s => selSet.has(s.n));
    if (selectedSups.length === 0) return;
    const qid = requestQuotes(selectedSups);
    setSelMode(false);
    setSelSet(new Set());
    setActiveScreen(`cotacao:${qid}`);
  };

  // Search hero inputs
  const [heroCity, setHeroCity] = useState('');
  const [heroType, setHeroType] = useState('Casa térrea');
  const [heroArea, setHeroArea] = useState('420');

  // Simulator
  const [simArea, setSimArea] = useState(420);
  const [simAreaInput, setSimAreaInput] = useState('420');
  const [simSys, setSimSys] = useState('alvenaria');
  const [simStd, setSimStd] = useState(1);
  const [stdLightbox, setStdLightbox] = useState<StandardInfo | null>(null);
  const simResult = simulate(simArea, simSys, simStd);

  useEffect(() => {
    if (!stdLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStdLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stdLightbox]);

  // LGPD e Conformidade Legal Brasileira
  const [cookieConsent, setCookieConsent] = useState(() => {
    try {
      return localStorage.getItem('ofir_lgpd_consent') === 'true';
    } catch {
      return false;
    }
  });
  const [signupConsent, setSignupConsent] = useState(false);

  const acceptLgpdConsent = () => {
    try {
      localStorage.setItem('ofir_lgpd_consent', 'true');
    } catch {}
    setCookieConsent(true);
    toast('Privacidade e LGPD', 'Suas preferências de privacidade foram salvas em conformidade com a Lei 13.709/2018.');
  };

  // Address edit state & CEP lookup
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: 'Obra', cep: '', street: '', num: '', comp: '', hood: '', city: '', uf: '' });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cepFeedback, setCepFeedback] = useState<string>('');
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [addrFormErrors, setAddrFormErrors] = useState<Record<string, string>>({});

  // Chat message input
  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Hotkey Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotOpen(true);
      }
      if (e.key === 'Escape') {
        setSpotOpen(false);
        setProfileSup(null);
        setActiveScreen(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openProfileByName = (name: string) => {
    const s = SUPPLIERS.find(x => x.n === name);
    if (s) setProfileSup(s);
  };

  const handleSelectToggle = (name: string) => {
    setSelSet(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleHeroSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetCity = heroCity.trim();
    const cleanedCep = targetCity.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await res.json();
        if (data.localidade) {
          targetCity = data.localidade;
          setHeroCity(`${data.localidade} - ${data.uf}`);
          setAddress({ cep: cleanedCep, city: data.localidade });
        }
      } catch {
        // Fallback silencioso
      }
    }
    setFilters({ city: targetCity, stage: 'all', sys: 'all', seg: 'svc' });
    const a = parseInt(heroArea.replace(/\D/g, ''), 10);
    if (!isNaN(a) && a >= 80 && a <= 20000) {
      setSimArea(a);
      setSimAreaInput(String(a));
      if (a > 5000 && simStd < 3) setSimStd(3);
    }
    document.getElementById('fornecedores')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToStage = (st: string, sysKey = 'all') => {
    setFilters({ seg: 'svc', stage: st, sys: sysKey });
    document.getElementById('fornecedores')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quando a UF muda, carrega as cidades daquela UF
  useEffect(() => {
    if (!addrForm.uf) {
      setCitiesList([]);
      return;
    }
    let isCurrent = true;
    setLoadingCities(true);

    // Carrega do catálogo local de cidades imediatamente para feedback instantâneo
    const initialList = TOP_CITIES_BY_UF[addrForm.uf.toUpperCase()] || [];
    setCitiesList(initialList);

    // Busca lista completa de municípios via IBGE com cache em memória
    fetchCitiesByUf(addrForm.uf).then(cities => {
      if (!isCurrent) return;
      if (cities && cities.length > 0) {
        if (addrForm.city && !cities.includes(addrForm.city)) {
          setCitiesList([addrForm.city, ...cities]);
        } else {
          setCitiesList(cities);
        }
      }
      setLoadingCities(false);
    }).catch(() => {
      if (isCurrent) setLoadingCities(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [addrForm.uf]);

  // Garante que a cidade selecionada esteja sempre presente na lista
  useEffect(() => {
    if (addrForm.city && !citiesList.includes(addrForm.city)) {
      setCitiesList(prev => [addrForm.city, ...prev]);
    }
  }, [addrForm.city, citiesList]);

  // Consulta do CEP no ViaCEP e preenchimento automático dos outros campos
  const handleCepLookup = async (digits: string) => {
    if (digits.length === 8) {
      setCepLoading(true);
      setCepStatus('loading');
      setCepFeedback('Buscando endereço...');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const newStreet = data.logradouro || '';
          const newHood = data.bairro || '';
          const newCity = data.localidade || '';
          const newUf = data.uf || '';

          setAddrForm(prev => ({
            ...prev,
            street: newStreet || prev.street,
            hood: newHood || prev.hood,
            city: newCity || prev.city,
            uf: newUf || prev.uf
          }));

          setCepStatus('success');
          setCepFeedback(`${newCity}/${newUf} localizado com sucesso`);

          // Limpa erros dos campos que foram preenchidos
          setAddrFormErrors(prev => {
            const next = { ...prev };
            delete next.cep;
            if (newStreet) delete next.street;
            if (newCity) delete next.city;
            if (newUf) delete next.uf;
            return next;
          });

          // Se a rua veio preenchida pelo CEP, foca no número. Senão, foca na rua.
          setTimeout(() => {
            if (newStreet) {
              document.getElementById('addr-num')?.focus();
            } else {
              document.getElementById('addr-street')?.focus();
            }
          }, 60);
        } else {
          setCepStatus('error');
          setCepFeedback('CEP não encontrado. Preencha os campos abaixo.');
        }
      } catch (err) {
        console.error(err);
        setCepStatus('error');
        setCepFeedback('Não foi possível consultar o CEP. Preencha manualmente.');
      } finally {
        setCepLoading(false);
      }
    } else {
      setCepStatus('idle');
      setCepFeedback('');
    }
  };

  const handleCepChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setAddrForm(prev => ({ ...prev, cep: masked }));
    if (digits.length === 8) {
      handleCepLookup(digits);
    } else {
      setCepStatus('idle');
      setCepFeedback('');
    }
  };

  const ufOptions = BRAZIL_UFS.map(u => ({
    value: u.uf,
    label: `${u.uf} - ${u.name}`,
    sublabel: u.region,
  }));

  const cityOptions = citiesList.map(c => ({
    value: c,
    label: c,
  }));

  const profileCityOptions = profileCitiesList.map(c => ({
    value: c,
    label: c,
  }));

  const handleAddrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const cleanCep = addrForm.cep.replace(/\D/g, '');
    if (!cleanCep || cleanCep.length < 8) {
      errors.cep = 'Informe um CEP válido com 8 dígitos';
    }
    if (!addrForm.street.trim()) {
      errors.street = 'Informe a rua / logradouro';
    }
    if (!addrForm.num.trim()) {
      errors.num = 'Informe o número';
    }
    if (!addrForm.uf.trim()) {
      errors.uf = 'Selecione o estado (UF)';
    }
    if (!addrForm.city.trim()) {
      errors.city = 'Selecione ou digite a cidade';
    }

    if (Object.keys(errors).length > 0) {
      setAddrFormErrors(errors);
      return;
    }

    setAddrFormErrors({});
    if (editAddrId) {
      updateAddress({ id: editAddrId, ...addrForm });
      setEditAddrId(null);
    } else {
      addAddress(addrForm);
    }
    setAddrForm({ label: 'Obra', cep: '', street: '', num: '', comp: '', hood: '', city: '', uf: '' });
    setCepStatus('idle');
    setCepFeedback('');
  };

  const filteredSuppliers = filterSuppliers(filters);

  // Address label display
  const addrLabel = curAddress ? `${curAddress.label} · ${curAddress.city}/${curAddress.uf}` : (filters.city || 'Informe o CEP');

  if (currentPortal === 'supplier') {
    return (
      <SupplierPortal
        onSwitchToClient={() => {
          setCurrentPortal('client');
          if (window.location.hash === '#fornecedor') {
            window.location.hash = '';
          }
        }}
      />
    );
  }

  return (
    <>
      {/* ----------------- NAVBAR ----------------- */}
      <header className="nav">
        <a className="logo" href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <LogoIcon />
          OFIR
        </a>

        <nav className={`tabs ${mobileTabsOpen ? 'open' : ''}`} id="tabs">
          <a className="active" href="#" onClick={() => setMobileTabsOpen(false)}>Explorar</a>
          <a href="#sistemas" onClick={() => setMobileTabsOpen(false)}>Sistemas construtivos</a>
          <a href="#etapas" onClick={() => setMobileTabsOpen(false)}>Etapas da obra</a>
          <a href="#fornecedores" onClick={() => setMobileTabsOpen(false)}>Fornecedores</a>
          <a href="#projetos" onClick={() => setMobileTabsOpen(false)}>Projetos prontos <span className="tag" style={{ background: 'var(--s3)', color: 'var(--muted)', fontWeight: 600 }}>Em breve</span></a>
          <a href="#" onClick={e => { e.preventDefault(); setMobileTabsOpen(false); setActiveScreen('analise-projeto'); }}>
            Análise com IA <span className="tag" style={{ background: 'var(--accent)', color: '#fff' }}>Novo</span>
          </a>
          <span className="sep"></span>
          <a href="#simulador" onClick={() => setMobileTabsOpen(false)}>Simulador <span className="tag">Novo</span></a>
          <a href="#simulador" onClick={() => setMobileTabsOpen(false)}>Financiamento</a>
          <a href="#etapas" onClick={() => setMobileTabsOpen(false)}>Guia da obra</a>
          <a href="#fornecedor" onClick={e => { e.preventDefault(); setMobileTabsOpen(false); setCurrentPortal('supplier'); window.location.hash = 'fornecedor'; }}>
            Área do Fornecedor <span className="tag" style={{ background: '#1d4ed8', color: '#fff', fontWeight: 700 }}>B2B</span>
          </a>
          <a href="#" onClick={e => { e.preventDefault(); setMobileTabsOpen(false); setActiveScreen('config'); }}>Configurações</a>
        </nav>

        <div className="actions">
          <button className="addr-chip" id="addr-chip" aria-label="Endereço de entrega" onClick={() => setActiveScreen('enderecos')}>
            <Svg k="pin" s={18} sw={1.8} />
            <span><small>Entregar em</small><b>{addrLabel}</b></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <button className="ghost sq orc-btn" aria-label="Orçamento" title="Orçamento" onClick={() => setActiveScreen('orc')}>
            <Svg k="orc" s={17} />
            {items.length > 0 && <span className="cnt">{items.length}</span>}
          </button>

          {/* BOTÃO E POPOVER DE NOTIFICAÇÕES */}
          <div className="notif-bell-wrap" ref={notifBellRef}>
            <button
              className={`ghost sq notif-btn ${unreadCount > 0 ? 'has-unread' : ''} ${notifOpen ? 'open' : ''}`}
              aria-label={`Notificações (${unreadCount} não lidas)`}
              title="Notificações"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Svg k="bell" s={17} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-popover" role="dialog" aria-label="Painel de notificações">
                <div className="notif-popover-head">
                  <div className="notif-popover-title-row">
                    <h4>Notificações</h4>
                    {unreadCount > 0 ? (
                      <span className="notif-count-pill">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</span>
                    ) : (
                      <span className="notif-count-pill" style={{ opacity: 0.7 }}>Em dia</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-read-btn"
                      onClick={() => markAllNotificationsAsRead()}
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                {/* Filtros em Pílulas */}
                <div className="notif-popover-tabs">
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifPopoverTab === 'all' ? 'active' : ''}`}
                    onClick={() => setNotifPopoverTab('all')}
                  >
                    Todas ({notifications.length})
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifPopoverTab === 'supplier_reply' ? 'active' : ''}`}
                    onClick={() => setNotifPopoverTab('supplier_reply')}
                  >
                    <Svg k="msg" s={12} color="currentColor" />
                    Respostas ({notifications.filter(n => n.category === 'supplier_reply').length})
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifPopoverTab === 'new_supplier' ? 'active' : ''}`}
                    onClick={() => setNotifPopoverTab('new_supplier')}
                  >
                    <Svg k="building" s={12} color="currentColor" />
                    Novos ({notifications.filter(n => n.category === 'new_supplier').length})
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifPopoverTab === 'platform_news' ? 'active' : ''}`}
                    onClick={() => setNotifPopoverTab('platform_news')}
                  >
                    <Svg k="sparkles" s={12} color="currentColor" />
                    Novidades ({notifications.filter(n => n.category === 'platform_news').length})
                  </button>
                </div>

                {/* Lista de Notificações no Popover */}
                <div className="notif-list-container">
                  {(() => {
                    const filtered = notifications.filter(n => {
                      if (notifPopoverTab === 'all') return true;
                      return n.category === notifPopoverTab;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="notif-empty">
                          <div className="notif-empty-icon">
                            <Svg k="bell" s={22} color="var(--accent)" />
                          </div>
                          <strong>Nenhuma notificação</strong>
                          <p>Tudo limpo por aqui nesta categoria.</p>
                        </div>
                      );
                    }

                    return filtered.slice(0, 5).map(n => {
                      const iconKey = n.icon || (n.category === 'supplier_reply' ? 'msg' : n.category === 'new_supplier' ? 'building' : 'sparkles');
                      const catLabel = n.category === 'supplier_reply' ? 'Resposta de Fornecedor' : n.category === 'new_supplier' ? 'Novo Fornecedor' : 'Novidade da Plataforma';

                      return (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={`notif-icon-box ${n.category} ${n.avatar ? `media ${n.avatar}` : ''}`}>
                            <Svg k={iconKey} s={18} color="currentColor" />
                          </div>
                          <div className="notif-content">
                            <div className="notif-header-row">
                              <span className="notif-title">{n.title}</span>
                              <span className="notif-time">{n.time}</span>
                            </div>
                            <p className="notif-desc">{n.description}</p>
                            <div className="notif-footer-row">
                              <span className={`notif-cat-tag ${n.category}`}>
                                <Svg k={iconKey} s={11} color="currentColor" />
                                {n.badge || catLabel}
                              </span>
                              {n.actionLabel && (
                                <span className="notif-action-hint">
                                  {n.actionLabel}
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m9 18 6-6-6-6" /></svg>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="notif-popover-foot">
                  <button
                    type="button"
                    className="notif-view-all-btn"
                    onClick={() => {
                      setNotifOpen(false);
                      setActiveScreen('notificacoes');
                    }}
                  >
                    <span>Ver todas as notificações ({notifications.length})</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="ghost sq" aria-label="Buscar" title="Buscar (Ctrl+K)" onClick={() => setSpotOpen(true)}>
            <Svg k="search" s={16} />
          </button>

          <button
            type="button"
            className="sup-portal-nav-btn hide-m"
            onClick={() => {
              setCurrentPortal('supplier');
              window.location.hash = 'fornecedor';
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(29, 78, 216, 0.08)',
              color: '#1d4ed8',
              border: '1px solid rgba(29, 78, 216, 0.25)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Acessar painel do fornecedor (RFQs, Propostas e Custódia)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M6 21V10l6-6 6 6v11M9 15l2 2 4-4" /></svg>
            Área do Fornecedor
          </button>

          {!user ? (
            <button className="btn" onClick={() => openAuth('login')}>Entrar</button>
          ) : (
            <div className="user" style={{ position: 'relative' }}>
              <button className="avatar-btn" aria-label="Minha conta" onClick={() => setMenuOpen(!menuOpen)}>
                {initials(user.name)}
              </button>
              {menuOpen && (
                <div className="umenu" role="menu" style={{ display: 'block' }}>
                  <div className="who"><b>{user.name}</b><span>{user.email}</span></div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setCurrentPortal('supplier');
                      window.location.hash = 'fornecedor';
                    }}
                    style={{ color: '#1d4ed8', fontWeight: 700 }}
                  >
                    <Svg k="building" s={16} color="#1d4ed8" /> Portal do Fornecedor
                    <span className="umenu-badge" style={{ background: '#1d4ed8', color: '#fff' }}>B2B</span>
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('notificacoes'); }}>
                    <Svg k="bell" s={16} /> Notificações
                    {unreadCount > 0 && <span className="umenu-badge">{unreadCount}</span>}
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('obra'); }}>
                    <Svg k="home" s={16} /> Minha obra
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('analise-projeto'); }}>
                    <Svg k="doc" s={16} /> Analisar projeto com IA
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('msgs'); }}>
                    <Svg k="msg" s={16} /> Mensagens
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('orc'); }}>
                    <Svg k="orc" s={16} /> Orçamento
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('hist'); }}>
                    <Svg k="doc" s={16} /> Pedidos e orçamentos
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('enderecos'); }}>
                    <Svg k="pin" s={16} /> Endereços de entrega
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('perfil'); }}>
                    <Svg k="user" s={16} /> Perfil
                  </button>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setActiveScreen('config'); }}>
                    <Svg k="settings" s={16} /> Configurações
                  </button>
                  <hr />
                  <button role="menuitem" className="danger" onClick={() => { setMenuOpen(false); signOut(); }}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="ghost sq menu-btn" aria-label="Menu" onClick={() => setMobileTabsOpen(!mobileTabsOpen)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </header>

      {/* Barra de endereço mobile */}
      <button className="addrbar" id="addrbar" onClick={() => setActiveScreen('enderecos')}>
        <Svg k="pin" s={18} sw={1.8} />
        <span>Entregar em <b>{addrLabel}</b></span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <main>
        {/* HERO */}
        <section className="hero">
          <h1 className="display">Encontre quem constrói <span>cada etapa</span> da sua obra</h1>
          <p className="lead">Compare sistemas construtivos, receba orçamentos de fornecedores da sua região e acompanhe a obra do projeto à entrega.</p>
          <form className="search" id="search" onSubmit={handleHeroSearch}>
            <div className="field">
              <label htmlFor="q-city">Onde</label>
              <input id="q-city" placeholder="CEP ou cidade" value={heroCity} onChange={e => setHeroCity(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="q-type">O que vai construir</label>
              <CustomSelect
                id="q-type"
                variant="hero"
                value={heroType}
                onChange={setHeroType}
                options={[
                  { value: 'Casa térrea', label: 'Casa térrea' },
                  { value: 'Sobrado', label: 'Sobrado' },
                  { value: 'Kitnets para renda', label: 'Kitnets para renda' },
                  { value: 'Galpão', label: 'Galpão' },
                  { value: 'Ampliação ou reforma', label: 'Ampliação ou reforma' },
                ]}
                placeholder="Tipo de imóvel"
                searchable={false}
              />
            </div>
            <div className="field">
              <label htmlFor="q-area">Área</label>
              <input id="q-area" inputMode="numeric" placeholder="420 m²" value={heroArea} onChange={e => setHeroArea(e.target.value)} />
            </div>
            <button className="btn" type="submit">
              <Svg k="search" s={15} sw={2.4} /> Buscar fornecedores
            </button>
          </form>
          <div className="popular">
            Mais buscados:
            <button type="button" onClick={() => goToStage('terreno')}>Sondagem e terraplenagem</button>
            <button type="button" onClick={() => goToStage('fundacao')}>Fundação</button>
            <button type="button" onClick={() => goToStage('estrutura', 'eps')}>Painel Monolítico (EPS)</button>
            <button type="button" onClick={() => goToStage('estrutura', 'steel')}>Steel frame</button>
            <button type="button" onClick={() => goToStage('cobertura')}>Telhado</button>
            <button type="button" onClick={() => goToStage('acabamento')}>Acabamentos</button>
          </div>
          <div className="trust">
            <div>
              <Svg k="shield" s={20} sw={1.8} />
              <span><b>Pagamento em custódia</b>Liberado por etapa, só com a sua aprovação</span>
            </div>
            <div>
              <Svg k="doc" s={20} sw={1.8} />
              <span><b>Fornecedores verificados</b>CNPJ, certidões e obras anteriores conferidos</span>
            </div>
            <div>
              <Svg k="projeto" s={20} sw={1.8} />
              <span><b>Contrato digital</b>Escopo, prazo e valores assinados na plataforma</span>
            </div>
            <div>
              <Svg k="user" s={20} sw={1.8} />
              <span><b>Mediação em disputas</b>Equipe acompanha cada contrato até a entrega</span>
            </div>
          </div>
        </section>

        {/* SISTEMAS CONSTRUTIVOS */}
        <section id="sistemas">
          <div className="sec-head">
            <div>
              <h2 className="display h-sec">Sistemas construtivos</h2>
              <p className="sub">Entenda como cada sistema funciona antes de escolher. Cada um tem seus próprios fornecedores e mão de obra.</p>
            </div>
            <div className="arrows">
              <button id="prev" aria-label="Anterior" onClick={() => railRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button id="next" aria-label="Próximo" onClick={() => railRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
          <div className="rail-wrap">
            <div className="rail" id="rail" ref={railRef}>
              {SYSTEMS.map(s => {
                const bgArt = SYSTEM_IMAGES[s.k];
                return (
                  <a key={s.k} href="#fornecedores" onClick={e => { e.preventDefault(); goToStage('estrutura', s.k); }}>
                    <div className={`media ${s.m} ${bgArt ? 'has-art' : ''}`}>
                      {bgArt ? (
                        <img src={bgArt} alt={s.n} className="media-art" loading="lazy" />
                      ) : (
                        <div className="inner"><Svg k="estrutura" s={56} /></div>
                      )}
                      <span className="badge">{s.f} fornecedores</span>
                    </div>
                    <h3>{s.n}</h3>
                    <p>{s.d}</p>
                    <div className="chips">
                      {s.t.map(t => <span key={t} className="chip">{t}</span>)}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* BANNER CTA: IA PARA PROJETO EM PDF */}
        <section style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 20px', width: '100%' }}>
          <div className="ai-cta">
            <div className="ai-cta-ico">
              <Svg k="doc" s={28} sw={1.8} />
            </div>
            <div>
              <span className="tag-ai"><Svg k="sparkles" s={12} color="#c9f2e3" /> Análise inteligente de projeto</span>
              <h3>Anexe o projeto arquitetônico em PDF e receba o checklist da obra</h3>
              <p>A IA lê as plantas, calcula quantitativos e sugere os melhores fornecedores da sua região. Depois você envia as solicitações de orçamento de uma vez só.</p>
            </div>
            <button className="btn lg" type="button" onClick={() => setActiveScreen('analise-projeto')}>
              <Svg k="clip" s={16} sw={2.2} /> Analisar projeto em PDF
            </button>
          </div>
        </section>

        {/* MINHA OBRA + ATALHOS */}
        <section className="feature-row">
          <div className="panel">
            <div className="panel-top">
              <div>
                <span className="eyebrow">Minha obra</span>
                <h2 className="display">{obra.name}</h2>
                <p className="meta">{obra.area} m² · {obra.system} · {curAddress ? `${curAddress.city}, ${curAddress.uf}` : `${obra.city}, ${obra.uf}`}</p>
              </div>
              <button className="ghost" onClick={() => setActiveScreen('obra')}>Abrir</button>
            </div>
            <div className="progress">
              <div className="bar">
                <i style={{ width: `${obraProgress}%` }}></i>
              </div>
              {obraProgress}%
            </div>
            <div className="steps">
              {widgetStages.map(s => (
                <div key={s.key} className={`step ${s.status}`}>
                  <button
                    type="button"
                    className="step-dot-btn"
                    title={`Etapa: ${s.name} (${s.status === 'done' ? 'Concluída' : s.status === 'running' ? 'Em andamento' : 'A iniciar'}). Clique para alternar status.`}
                    onClick={() => advanceStage(s.key)}
                  >
                    <span className="dot"></span>
                  </button>
                  <span
                    className="step-name"
                    onClick={() => goToStage(s.key, obra.systemKey)}
                    title={`Ver fornecedores para ${s.name}`}
                  >
                    {s.name}
                  </span>
                  <small onClick={() => advanceStage(s.key)} title="Clique para avançar status">
                    {s.date || (s.status === 'done' ? 'concluído' : s.status === 'running' ? 'em andamento' : 'a iniciar')}
                  </small>
                </div>
              ))}
            </div>
            <div className="next">
              <div>
                <b>Próximo passo</b>
                {nextStage ? `Contratar fornecedor de ${nextStage.name.toLowerCase()}` : 'Todas as etapas da obra concluídas!'}
              </div>
              {nextStage && (
                <button className="btn sm" onClick={() => goToStage(nextStage.key, obra.systemKey)}>
                  Ver opções
                </button>
              )}
            </div>
          </div>

          <div className="cards">
            <a className="card" href="#projetos">
              <div className="card-head">
                <span className="ico acc"><Svg k="projeto" s={17} /></span>
                <span className="count" style={{ background: 'var(--s3)', color: 'var(--muted)', fontWeight: 600 }}>Em breve</span>
              </div>
              <div><h4>Projetos prontos</h4><p>Plantas aprovadas para começar mais rápido (Em breve)</p></div>
            </a>
            <a className="card" href="#fornecedores" onClick={e => { e.preventDefault(); goToStage('terreno'); }}>
              <div className="card-head">
                <span className="ico"><Svg k="terreno" s={17} /></span>
                <span className="count">48 equipes</span>
              </div>
              <div><h4>Sondagem e terraplenagem</h4><p>Sondagem de solo, corte, aterro e compactação</p></div>
            </a>
            <a className="card" href="#fornecedores" onClick={e => { e.preventDefault(); goToStage('fundacao'); }}>
              <div className="card-head">
                <span className="ico"><Svg k="fundacao" s={17} /></span>
                <span className="count">96 equipes</span>
              </div>
              <div><h4>Fundações</h4><p>Radier, estacas e sapatas</p></div>
            </a>
            <a className="card" href="#fornecedores" onClick={e => { e.preventDefault(); goToStage('estrutura'); }}>
              <div className="card-head">
                <span className="ico"><Svg k="estrutura" s={17} /></span>
                <span className="count">388 equipes</span>
              </div>
              <div><h4>Vedação e estrutura</h4><p>Painel Monolítico EPS e Steel Frame</p></div>
            </a>
            <a className="card" href="#fornecedores" onClick={e => { e.preventDefault(); goToStage('cobertura'); }}>
              <div className="card-head">
                <span className="ico"><Svg k="cobertura" s={17} /></span>
                <span className="count">132 equipes</span>
              </div>
              <div><h4>Cobertura e telhado</h4><p>Estrutura, telhas e calhas</p></div>
            </a>
            <a className="card" href="#simulador">
              <div className="card-head">
                <span className="ico acc"><Svg k="orc" s={17} /></span>
                <span className="tag">Novo</span>
              </div>
              <div><h4>Simulador de custo</h4><p>Faixa de custo e prazo por sistema</p></div>
            </a>
            <a className="card" href="#" onClick={e => e.preventDefault()}>
              <div className="card-head">
                <span className="ico"><Svg k="home" s={17} /></span>
                <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M8 7h9v9" /></svg>
              </div>
              <div><h4>Financiamento</h4><p>Compare linhas para construção</p></div>
            </a>
          </div>
        </section>

        {/* ETAPAS DA OBRA */}
        <section className="split" id="etapas">
          <div className="split-left">
            <span className="eyebrow">Etapas da obra</span>
            <h2 className="display">Uma obra são 10 contratações</h2>
            <p>Escolha a etapa em que você está e veja só os fornecedores que fazem aquela parte, na sua região.</p>
            <div>
              <button className="btn" onClick={() => goToStage('all')}>Ver todos os fornecedores</button>
            </div>
          </div>
          <div className="stages" id="stages">
            {STAGES.map((s, i) => (
              <button key={s[0]} className={`stage ${filters.stage === s[0] ? 'on' : ''}`} onClick={() => goToStage(s[0])}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <b>{s[1]}</b>
                  <span>{STAGE_COUNT[s[0]]} fornecedores na região</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* FORNECEDORES */}
        <section id="fornecedores">
          <div className="sec-head">
            <div>
              <h2 className="display h-sec">Prestadores e Fornecedores de Serviços</h2>
              <p className="sub" id="sup-sub">{filterSummary(filters, filteredSuppliers.length)}</p>
            </div>
          </div>
          <div className="toolbar">
            <div className="filters" id="filters">
              <button className={filters.stage === 'all' ? 'on' : ''} onClick={() => setFilters({ stage: 'all' })}>
                Todas as etapas
              </button>
              {STAGES.map(s => (
                <button key={s[0]} className={filters.stage === s[0] ? 'on' : ''} onClick={() => setFilters({ stage: s[0] })}>
                  {s[1]}
                </button>
              ))}
            </div>

            <CustomSelect
              id="f-sys"
              variant="filter"
              ariaLabel="Sistema construtivo"
              value={filters.sys}
              onChange={val => setFilters({ sys: val })}
              options={[
                { value: 'all', label: 'Todos os sistemas' },
                ...SYSTEMS.map(s => ({ value: s.k, label: s.n }))
              ]}
              placeholder="Sistema construtivo"
              searchable={false}
            />

            <div className="viewtog" role="group" aria-label="Modo de visualização" id="viewtog">
              <button aria-pressed={viewMode === 'grid'} aria-label="Cards" title="Cards" onClick={() => setViewMode('grid')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
              </button>
              <button aria-pressed={viewMode === 'list'} aria-label="Lista" title="Lista" onClick={() => setViewMode('list')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" fill="currentColor" /><circle cx="3.5" cy="12" r="1" fill="currentColor" /><circle cx="3.5" cy="18" r="1" fill="currentColor" /></svg>
              </button>
            </div>

            <button className={`ghost sm selmode-btn ${selMode ? 'on' : ''}`} id="selmode-btn" type="button" onClick={() => { setSelMode(!selMode); if (selMode) setSelSet(new Set()); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="m16.2 17 1.3 1.3 2.3-2.6" strokeWidth="2.4" /></svg>
              <span>Cotar vários</span>
            </button>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="empty-s">
              <div className="empty-circle">
                <Icon k="search" s={38} color="var(--accent)" />
              </div>
              <b>Nenhum fornecedor encontrado</b>
              Tente limpar os filtros de sistema ou buscar por outra cidade da região.
              <button className="btn sm" style={{ marginTop: 8 }} onClick={() => setFilters({ stage: 'all', sys: 'all', city: '' })}>Limpar filtros</button>
            </div>
          ) : viewMode === 'list' ? (
            <div className={`grid is-list ${selMode ? 'sel-mode' : ''}`} id="grid">
              <div className="list-head">
                <span></span><span>Fornecedor</span><span>Etapa</span><span>Avaliação</span><span>Resposta</span><span></span>
              </div>
              {filteredSuppliers.map(x => {
                const selectable = !sent[x.n];
                const isChecked = selSet.has(x.n);
                const cat = catOf(x, filters);
                return (
                  <article
                    key={x.n}
                    className={`srow sup-row ${selectable ? 'selectable' : ''} ${isChecked ? 'checked' : ''}`}
                    onClick={() => {
                      if (selMode) {
                        if (selectable) handleSelectToggle(x.n);
                      } else {
                        enterSupplierAndQuote(x);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={`av media ${x.m}`}>
                      {selectable && (
                        <span className="sel-chk" style={{ display: isChecked ? 'grid' : 'none' }}>
                          <Svg k="check" s={14} />
                        </span>
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h4 onClick={e => { e.stopPropagation(); startQuote(x, true); setProfileSup(x); }} style={{ cursor: 'pointer' }}>
                        <span>{x.n}</span> {CHECK_BADGE}
                      </h4>
                      <p className="c loc-m"><small>{x.c}{x.s !== 'all' ? ' · ' + sysName(x.s) : ''}</small></p>
                    </div>
                    <p className="c">{stageName(cat)}</p>
                    <div className="rate">{STAR_ICON}<b>{rate(x.r)}</b>({x.a})</div>
                    <p className="c">{'Até ' + x.t}</p>
                    <div>
                      {sent[x.n] ? (
                        <button className="btn sm sent" onClick={e => { e.stopPropagation(); setActiveScreen(`chat:${sent[x.n]}`); }}>
                          <Svg k="msg" s={14} />
                          <span className="lbl-l">Abrir conversa</span><span className="lbl-s">Conversa</span>
                        </button>
                      ) : (
                        <button className="btn sm" onClick={e => { e.stopPropagation(); enterSupplierAndQuote(x); }}>
                          <Svg k="msg" s={14} />
                          <span className="lbl-l">Pedir orçamento</span><span className="lbl-s">Orçamento</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={`grid ${selMode ? 'sel-mode' : ''}`} id="grid">
              {filteredSuppliers.map(x => {
                const selectable = !sent[x.n];
                const isChecked = selSet.has(x.n);
                const cat = catOf(x, filters);
                return (
                  <article
                    key={x.n}
                    className={`sup ${selectable ? 'selectable' : ''} ${isChecked ? 'checked' : ''}`}
                    onClick={() => {
                      if (selMode) {
                        if (selectable) handleSelectToggle(x.n);
                      } else {
                        enterSupplierAndQuote(x);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`media ${x.m}`}>
                      {selectable && (
                        <span className="sel-chk" style={{ display: isChecked ? 'grid' : 'none' }}>
                          <Svg k="check" s={14} />
                        </span>
                      )}
                      <div className="inner"><Svg k={cat} s={48} /></div>
                      <span className="badge">{stageName(cat)}</span>
                      {(x.s === 'eps' || x.n.includes('Painel Monolítico')) && (
                        <span style={{ position: 'absolute', top: 12, right: 12, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, zIndex: 2 }}>
                          Mais procurado
                        </span>
                      )}
                    </div>
                    <div className="sup-body">
                      <div>
                        <h4 onClick={e => { e.stopPropagation(); startQuote(x, true); setProfileSup(x); }} style={{ cursor: 'pointer' }}>
                          {x.n} {CHECK_BADGE}
                        </h4>
                        <p className="loc">{x.c}{x.s !== 'all' ? ' · ' + sysName(x.s) : ''}</p>
                      </div>
                      <div className="rate">{STAR_ICON}<b>{rate(x.r)}</b>{x.a} avaliações</div>
                      <div className="sup-foot">
                        <span>{'Responde em até ' + x.t}</span>
                        {sent[x.n] ? (
                          <button className="btn sm sent" onClick={e => { e.stopPropagation(); setActiveScreen(`chat:${sent[x.n]}`); }}>
                            <Svg k="msg" s={14} />
                            <span className="lbl-l">Abrir conversa</span><span className="lbl-s">Conversa</span>
                          </button>
                        ) : (
                          <button className="btn sm" onClick={e => { e.stopPropagation(); enterSupplierAndQuote(x); }}>
                            <Svg k="msg" s={14} />
                            <span className="lbl-l">Pedir orçamento</span><span className="lbl-s">Orçamento</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* BARRA FIXA COTAR VÁRIOS */}
        {selMode && (
          <div className="selbar" id="selbar">
            <span id="selbar-cnt">{selSet.size === 0 ? 'Selecione os fornecedores' : selSet.size === 1 ? '1 selecionado' : `${selSet.size} selecionados`}</span>
            <span className="sp"></span>
            <button className="ghost" id="selbar-cancel" type="button" onClick={() => { setSelMode(false); setSelSet(new Set()); }}>Cancelar</button>
            <button
              className="btn selbar-chat-btn"
              id="selbar-chat"
              type="button"
              disabled={selSet.size === 0}
              onClick={handleOpenChatFromSelbar}
            >
              <Svg k="msg" s={16} />
              <span>Abrir conversas</span>
            </button>
            <button
              className="ghost"
              id="selbar-go"
              type="button"
              disabled={selSet.size === 0}
              onClick={handleRequestQuotesFromSelbar}
            >
              Pedir cotação
            </button>
          </div>
        )}

        {/* SIMULADOR */}
        <section className="sim" id="simulador">
          <div className="sim-left">
            <span className="eyebrow">Simulador</span>
            <h2 className="display">Quanto custa <span>e quanto demora</span> a sua obra</h2>
            <p>Mude a área, o sistema e o padrão de acabamento para comparar cenários antes de pedir orçamento.</p>
            <div><a className="btn lg" href="#fornecedores">Pedir orçamentos reais</a></div>
          </div>
          <div className="sim-form">
            <div className="ctrl">
              {(() => {
                const simMaxArea = simStd >= 3 ? 20000 : simStd === 2 ? 5000 : 2000;
                const simStepArea = simArea >= 5000 ? 250 : simArea >= 1500 ? 100 : 10;
                const simAreaChips = simStd >= 3
                  ? [420, 1000, 3500, 8000, 15000, 20000]
                  : simStd === 2
                  ? [250, 420, 800, 1500, 3000, 5000]
                  : [80, 180, 300, 420, 750, 1500];
                return (
                  <>
                    <div className="sim-area-row">
                      <label htmlFor="s-area-input">Área construída</label>
                      <div className="sim-area-manual-wrap" title="Clique para alterar a metragem manualmente">
                        <input
                          type="text"
                          id="s-area-input"
                          className="sim-area-manual-input"
                          inputMode="numeric"
                          value={simAreaInput}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setSimAreaInput(raw);
                            const num = parseInt(raw, 10);
                            if (!isNaN(num)) {
                              const clamped = Math.min(20000, Math.max(1, num));
                              setSimArea(clamped);
                              if (clamped > 5000 && simStd < 3) {
                                setSimStd(3);
                              }
                            }
                          }}
                          onBlur={() => {
                            const num = parseInt(simAreaInput, 10);
                            const finalVal = isNaN(num) || num < 80 ? 80 : Math.min(20000, num);
                            setSimArea(finalVal);
                            setSimAreaInput(String(finalVal));
                          }}
                          placeholder="420"
                        />
                        <span className="sim-area-manual-unit">m²</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      id="s-area"
                      min="80"
                      max={simMaxArea}
                      step={simStepArea}
                      value={simArea}
                      onChange={e => {
                        const v = +e.target.value;
                        setSimArea(v);
                        setSimAreaInput(String(v));
                      }}
                    />
                    <div className="sim-area-chips">
                      {simAreaChips.map(val => (
                        <button
                          key={val}
                          type="button"
                          className={`sim-chip ${simArea === val ? 'on' : ''}`}
                          onClick={() => {
                            setSimArea(val);
                            setSimAreaInput(String(val));
                          }}
                        >
                          {val.toLocaleString('pt-BR')} m²
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="ctrl">
              <label htmlFor="s-sys">Sistema construtivo</label>
              <CustomSelect
                id="s-sys"
                variant="sim"
                value={simSys}
                onChange={setSimSys}
                options={SYSTEMS.map(s => ({ value: s.k, label: s.n, sublabel: s.d }))}
                placeholder="Sistema construtivo"
                searchable={false}
              />
            </div>
            <div className="ctrl std-ctrl">
              {(() => {
                const currentStd = STANDARD_INFO[simStd] || STANDARD_INFO[0];
                return (
                  <>
                    <div className="std-ctrl-head">
                      <label>Padrão de acabamento</label>
                      <span className="std-active-tag">
                        {currentStd.tag} · {currentStd.m2Ref}
                      </span>
                    </div>

                    <div className="seg std-seg" id="s-std" role="tablist" aria-label="Padrão de acabamento">
                      {STANDARDS.map((name, idx) => (
                        <button
                          key={name}
                          type="button"
                          role="tab"
                          aria-selected={simStd === idx}
                          className={`std-btn ${simStd === idx ? 'on' : ''}`}
                          onClick={() => {
                            setSimStd(idx);
                            const maxForIdx = idx >= 3 ? 20000 : idx === 2 ? 5000 : 2000;
                            if (simArea > maxForIdx) {
                              setSimArea(maxForIdx);
                              setSimAreaInput(String(maxForIdx));
                            }
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {/* Prévia visual fixa e permanente da casa para o padrão selecionado */}
                    <div
                      className="std-preview-card"
                      aria-label={`Prévia do ${currentStd.label}. Clique para ver ampliado`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setStdLightbox(currentStd)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setStdLightbox(currentStd);
                        }
                      }}
                      title="Clique para ver a foto ampliada"
                    >
                      <div className="std-preview-media">
                        <img
                          src={currentStd.img}
                          alt={currentStd.label}
                          className="std-preview-img"
                          key={currentStd.idx}
                          loading="lazy"
                        />
                        <span className="std-preview-badge">{currentStd.tag}</span>
                        <div className="std-preview-zoom-hint">
                          <Svg k="search" s={13} />
                          <span>Ampliar</span>
                        </div>
                      </div>
                      <div className="std-preview-body">
                        <div className="std-preview-header">
                          <span className="std-preview-title">{currentStd.label}</span>
                          <span className="std-preview-m2">{currentStd.m2Ref}</span>
                        </div>
                        <p className="std-preview-desc">{currentStd.desc}</p>
                        <div className="std-preview-action">
                          <span className="std-preview-action-btn">
                            <Svg k="search" s={12} />
                            <span>Clique para ver ampliado</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="result">
              <div><span>Custo estimado</span><b id="r-cost">{simResult.cost}</b></div>
              <div>
                <span>Valor por m²</span>
                <b id="r-m2">{simResult.m2}</b>
                <span className="result-m2-avg">Média: {simResult.m2Val}</span>
              </div>
              <div className="result-time"><span>Prazo estimado</span><b id="r-time">{simResult.time}</b></div>
            </div>
            <p className="note">Valores referenciais calculados com base em benchmarking de mercado e CUB/Sinduscon estadual. No Ultra Luxo (R$ 9.000 a R$ 20.000+/m², com média de R$ 14.500/m²), os custos consideram acabamentos importados, automação completa e especificidades do projeto.</p>
          </div>
        </section>

        {/* LIGHTBOX DO PADRÃO DA CASA */}
        {stdLightbox && (
          <div
            className="std-lightbox-overlay"
            onClick={() => setStdLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Visualização em lightbox do ${stdLightbox.label}`}
          >
            <div
              className="std-lightbox-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="std-lightbox-head">
                <div className="std-lightbox-title-wrap">
                  <span className="std-lightbox-badge">{stdLightbox.tag}</span>
                  <span className="std-lightbox-title">{stdLightbox.label}</span>
                  <span className="std-lightbox-m2">{stdLightbox.m2Ref}</span>
                </div>
                <button
                  type="button"
                  className="std-lightbox-close"
                  onClick={() => setStdLightbox(null)}
                  aria-label="Fechar lightbox"
                >
                  <Svg k="x" s={18} />
                </button>
              </div>

              <div className="std-lightbox-media">
                <img
                  src={stdLightbox.img}
                  alt={stdLightbox.label}
                  className="std-lightbox-img"
                />
              </div>

              <div className="std-lightbox-foot">
                <p className="std-lightbox-desc">{stdLightbox.desc}</p>
              </div>
            </div>
          </div>
        )}


        {/* PROJETOS PRONTOS */}
        <section id="projetos">
          <div className="sec-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 className="display h-sec">Projetos prontos</h2>
                <span className="plan-badge-soon">Em breve</span>
              </div>
              <p className="sub">
                Plantas completas com projetos complementares prontos para construir. <strong>Recurso em desenvolvimento. Lançamento futuro.</strong>
              </p>
            </div>
            <span className="ghost disabled" style={{ opacity: 0.65, cursor: 'not-allowed', pointerEvents: 'none', background: 'var(--s2)' }}>
              Lançamento futuro
            </span>
          </div>
          <div className="plans" id="plans">
            {PLANS.map(p => (
              <div key={p.n} className="plan is-disabled" aria-disabled="true">
                <div className="plan-img">
                  <span className="plan-overlay-tag">Em breve</span>
                  <svg viewBox="-2 -2 74 64" fill="none" stroke="#3d4b59" strokeWidth=".8">
                    {p.rooms.map(([x, y, w, h, l]) => (
                      <g key={l + x + y}>
                        <rect x={x} y={y} width={w} height={h} />
                        <text x={x + w / 2} y={y + h / 2 + 1.2} fill="#3d4b59" stroke="none" fontSize="3.4" fontFamily="Inter" textAnchor="middle">{l}</text>
                      </g>
                    ))}
                    <rect x="-1" y="-1" width="72" height="62" strokeWidth="1.6" />
                  </svg>
                </div>
                <div className="plan-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <h4>{p.n}</h4>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, background: 'var(--s2)', padding: '2px 6px', borderRadius: 4 }}>
                      Em breve
                    </span>
                  </div>
                  <div className="specs">
                    <span>{p.a} m²</span>
                    <span>{p.q} {p.q > 1 ? 'quartos' : 'quarto'}</span>
                    <span>{p.b} {p.b > 1 ? 'banheiros' : 'banheiro'}</span>
                  </div>
                  <div className="chips"><span className="chip">{p.s}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ----------------- FOOTER ----------------- */}
      <footer>
        <div className="foot">
          <div>
            <a className="logo" href="#">
              <LogoIcon />
              OFIR
            </a>
            <p>Plataforma que conecta quem vai construir aos fornecedores de cada etapa da obra.</p>
          </div>
          <div>
            <h5>Para quem constrói</h5>
            <a href="#sistemas">Sistemas construtivos</a>
            <a href="#etapas">Etapas da obra</a>
            <a href="#simulador">Simulador</a>
            <a href="#projetos">Projetos prontos (Em breve)</a>
          </div>
          <div>
            <h5>Para fornecedores</h5>
            <a href="#" onClick={e => { e.preventDefault(); openAuth('signup'); }}>Cadastrar empresa</a>
            <a href="#fornecedor" onClick={e => { e.preventDefault(); setCurrentPortal('supplier'); window.location.hash = 'fornecedor'; }}>Portal do Fornecedor (B2B)</a>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('conformidade'); }}>Custódia e Repasses</a>
          </div>
          <div>
            <h5>Conteúdo</h5>
            <a href="#etapas">Guia da obra</a>
            <a href="#sistemas">Comparativo de sistemas</a>
            <a href="#simulador">Simulador e Financiamento</a>
          </div>
          <div>
            <h5>Empresa & Legal</h5>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('sobre'); }}>Sobre a OFIR</a>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('termos'); }}>Termos de Uso</a>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('privacidade'); }}>Privacidade (LGPD)</a>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('conformidade'); }}>Conformidade Legal</a>
            <a href="#" onClick={e => { e.preventDefault(); setActiveScreen('config'); }}>Configurações</a>
          </div>
        </div>
      </footer>

      {/* ----------------- BARRA DE ABAS MOBILE ----------------- */}
      <nav className="tabbar" id="tabbar" aria-label="Navegação">
        <button className={activeScreen === null ? 'on' : ''} onClick={() => setActiveScreen(null)}>
          <Svg k="home" s={22} /> Início
        </button>
        <button onClick={() => { setActiveScreen(null); document.getElementById('fornecedores')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <Svg k="search" s={22} /> Buscar
        </button>
        <button className={activeScreen === 'orc' ? 'on' : ''} onClick={() => setActiveScreen('orc')}>
          <div style={{ position: 'relative' }}>
            <Svg k="orc" s={22} />
            {items.length > 0 && <span className="cnt">{items.length}</span>}
          </div>
          Orçamento
        </button>
        <button className={activeScreen === 'obra' ? 'on' : ''} onClick={() => setActiveScreen('obra')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="15" width="20" height="6" rx="1" /><rect x="5" y="8" width="14" height="5" rx="1" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
          Obra
        </button>
        <button className={activeScreen === 'msgs' ? 'on' : ''} onClick={() => setActiveScreen('msgs')}>
          <Svg k="msg" s={22} /> Mensagens
        </button>
      </nav>

      {/* ----------------- MODAL DE TELAS INTERNAS ----------------- */}
      {activeScreen && (
        <div className="screen" id="screen" style={{ display: 'flex' }}>
          <div className="screen-scrim" onClick={() => setActiveScreen(null)}></div>
          <div className={`screen-panel ${['analise-projeto', 'notificacoes', 'termos', 'privacidade', 'conformidade', 'sobre', 'perfil', 'enderecos', 'checkout', 'obra'].includes(activeScreen || '') ? 'wide' : ''}`} id="screen-panel">
            <header className="screen-head">
              {activeScreen?.startsWith('chat:') || activeScreen?.startsWith('cotacao:') || activeScreen?.startsWith('ped:') || activeScreen === 'checkout' || activeScreen === 'paid' ? (
                <button className="icon-btn" aria-label="Voltar" onClick={() => {
                  if (activeScreen?.startsWith('ped:')) setActiveScreen('hist');
                  else if (activeScreen === 'checkout') setActiveScreen('orc');
                  else if (activeScreen === 'paid') setActiveScreen('hist');
                  else setActiveScreen('msgs');
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
              ) : null}
              <h3 id="screen-title">
                {activeScreen === 'notificacoes' && 'Notificações'}
                {activeScreen === 'obra' && 'Minha obra'}
                {activeScreen === 'analise-projeto' && 'Análise de projeto arquitetônico com IA'}
                {activeScreen === 'msgs' && 'Mensagens'}
                {activeScreen === 'cotacoes' && 'Cotações enviadas'}
                {activeScreen?.startsWith('cotacao:') && `Cotação ${activeScreen.split(':')[1]}`}
                {activeScreen?.startsWith('chat:') && (
                  (() => {
                    const c = conversations.find(x => x.id === activeScreen.split(':')[1]);
                    return c ? `${c.n}` : 'Conversa';
                  })()
                )}
                {activeScreen === 'orc' && <>Orçamento <small>{orcName}</small></>}
                {activeScreen === 'checkout' && 'Finalizar compra'}
                {activeScreen === 'paid' && 'Pagamento aprovado'}
                {activeScreen === 'enderecos' && 'Endereços de entrega'}
                {activeScreen === 'hist' && 'Pedidos e orçamentos'}
                {activeScreen?.startsWith('ped:') && `Pedido ${activeScreen.split(':')[1]}`}
                {activeScreen === 'perfil' && 'Perfil'}
                {activeScreen === 'config' && 'Configurações'}
                {activeScreen === 'termos' && 'Termos de Uso da Plataforma'}
                {activeScreen === 'privacidade' && 'Privacidade & LGPD (Lei 13.709/2018)'}
                {activeScreen === 'conformidade' && 'Conformidade com a Legislação Brasileira'}
                {activeScreen === 'sobre' && 'Sobre a OFIR'}
              </h3>
              <button className="icon-btn" id="screen-x" aria-label="Fechar" onClick={() => setActiveScreen(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>

            <div className="screen-body" id="screen-body">
              {/* TELA: MINHA OBRA */}
              {activeScreen === 'obra' && (
                <>
                  <div className="panel" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <span className="eyebrow">Minha obra</span>
                        <h2 className="display" style={{ fontSize: 24, marginTop: 4 }}>{obra.name}</h2>
                        <p className="meta">{obra.area} m² · {obra.system} · {curAddress ? `${curAddress.city}, ${curAddress.uf}` : `${obra.city}, ${obra.uf}`}</p>
                      </div>
                      <button className="ghost sm" type="button" onClick={() => setEditingObra(!editingObra)}>
                        {editingObra ? 'Fechar' : 'Editar dados'}
                      </button>
                    </div>

                    {editingObra && (
                      <form className="obra-edit" onSubmit={e => {
                        e.preventDefault();
                        updateObra({
                          name: obraForm.name,
                          area: Number(obraForm.area) || obra.area,
                          system: obraForm.system,
                          city: obraForm.city,
                          uf: obraForm.uf
                        });
                        setEditingObra(false);
                        toast('Obra atualizada', `${obraForm.name} · ${obraForm.city}`);
                      }}>
                        <div className="inp">
                          <label>Nome da obra</label>
                          <input value={obraForm.name} onChange={e => setObraForm({ ...obraForm, name: e.target.value })} />
                        </div>
                        <div className="inp">
                          <label>Área construída (m²)</label>
                          <input type="number" value={obraForm.area} onChange={e => setObraForm({ ...obraForm, area: Number(e.target.value) })} />
                        </div>
                        <CustomSelect
                          id="obra-system"
                          label="Sistema construtivo"
                          value={obraForm.system}
                          onChange={val => setObraForm({ ...obraForm, system: val })}
                          options={SYSTEMS.map(s => ({ value: s.n, label: s.n, sublabel: s.d }))}
                          placeholder="Selecione o sistema construtivo"
                          searchable={false}
                        />
                        <div className="inp">
                          <label htmlFor="obra-cep">CEP da obra / terreno</label>
                          <div className="cep-input-wrap">
                            <input
                              id="obra-cep"
                              value={obraCep}
                              onChange={e => handleObraCepLookup(e.target.value)}
                              placeholder="00000-000"
                              maxLength={9}
                              inputMode="numeric"
                              autoComplete="postal-code"
                            />
                            {obraCepStatus === 'loading' && (
                              <span className="cep-status-icon"><span className="cep-spin" /></span>
                            )}
                            {obraCepStatus === 'success' && (
                              <span className="cep-status-icon ok" title="Localidade encontrada">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-10" /></svg>
                              </span>
                            )}
                            {obraCepStatus === 'error' && (
                              <span className="cep-status-icon err" title="CEP não encontrado">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6 6 18" /></svg>
                              </span>
                            )}
                          </div>
                          {obraCepFeedback ? (
                            <small className={`cep-info ${obraCepStatus === 'success' ? 'ok' : obraCepStatus === 'error' ? 'err' : ''}`}>
                              {obraCepFeedback}
                            </small>
                          ) : (
                            <small className="hint">Preenche estado e cidade automaticamente</small>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                          <CustomSelect
                            id="obra-uf"
                            label="UF"
                            value={obraForm.uf}
                            onChange={val => {
                              setObraForm(prev => ({
                                ...prev,
                                uf: val,
                                city: prev.uf !== val ? '' : prev.city
                              }));
                            }}
                            options={ufOptions}
                            placeholder="UF"
                            searchPlaceholder="Buscar estado..."
                            searchable={true}
                            autoComplete="address-level1"
                          />
                          <CustomSelect
                            id="obra-city"
                            label="Cidade"
                            value={obraForm.city}
                            onChange={val => setObraForm(prev => ({ ...prev, city: val }))}
                            options={obraCityOptions}
                            placeholder={obraForm.uf ? 'Buscar ou selecionar cidade' : 'Selecione a UF'}
                            searchPlaceholder="Buscar cidade..."
                            loading={obraLoadingCities}
                            disabled={!obraForm.uf && obraCityOptions.length === 0}
                            allowCustomInput={true}
                            searchable={true}
                            autoComplete="address-level2"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button className="btn sm" type="submit">Salvar dados</button>
                          <button className="ghost sm" type="button" onClick={() => setEditingObra(false)}>Cancelar</button>
                        </div>
                      </form>
                    )}

                    <div className="progress">
                      <div className="bar">
                        <i style={{ width: `${obraProgress}%` }}></i>
                      </div>
                      {obraProgress}%
                    </div>
                  </div>

                  <p className="sec-label">Etapas da obra ({obra.stages.filter(s => s.status === 'done').length} de {obra.stages.length} concluídas)</p>
                  <div className="steps">
                    {obra.stages.map(s => (
                      <div key={s.key} className={`step ${s.status}`}>
                        <button
                          type="button"
                          className="step-dot-btn"
                          title={`Status: ${s.status === 'done' ? 'Concluída' : s.status === 'running' ? 'Em andamento' : 'A iniciar'}. Clique para alterar.`}
                          onClick={() => advanceStage(s.key)}
                        >
                          <span className="dot"></span>
                        </button>
                        <span
                          className="step-name"
                          onClick={() => { setActiveScreen(null); goToStage(s.key, obra.systemKey); }}
                          title={`Ver fornecedores para ${s.name}`}
                        >
                          {s.name}
                        </span>
                        <small onClick={() => advanceStage(s.key)} title="Clique para avançar status">
                          {s.date || (s.status === 'done' ? 'concluído' : s.status === 'running' ? 'em andamento' : 'a iniciar')}
                        </small>
                      </div>
                    ))}
                  </div>

                  <p className="sec-label">Contratos e pagamentos</p>
                  {obra.stages.filter(s => s.contract).map(s => (
                    <div key={s.key} className="contract">
                      <span className={`av media ${s.contract!.m || 'm1'}`}></span>
                      <div className="txt">
                        <b>{s.contract!.sup}</b>
                        <span>{s.contract!.stageName} · R$ {s.contract!.value.toLocaleString('pt-BR')} · {s.status === 'done' ? 'concluído' : s.contract!.status.toLowerCase()}</span>
                      </div>
                      <span className={`pill ${s.contract!.status === 'Pago' ? 'ok' : 'recv'}`}>{s.contract!.status}</span>
                    </div>
                  ))}

                  <p className="sec-label">Próximo passo</p>
                  <div className="list">
                    {nextStage ? (
                      <button onClick={() => { setActiveScreen(null); goToStage(nextStage.key, obra.systemKey); }}>
                        <span>
                          <b style={{ display: 'block', fontWeight: 600 }}>Contratar {nextStage.name.toLowerCase()}</b>
                          <small>Compare fornecedores e equipes na sua região</small>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                      </button>
                    ) : (
                      <div style={{ padding: 14, color: 'var(--ok)', fontWeight: 600 }}>Todas as etapas da obra estão concluídas!</div>
                    )}
                  </div>

                  <p className="sec-label">Projeto Arquitetônico</p>
                  <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <b style={{ display: 'block', fontSize: 14 }}>Analisar projeto com IA</b>
                      <small style={{ color: 'var(--muted)', fontSize: 12 }}>Anexe o PDF para gerar o checklist de itens e fornecedores</small>
                    </div>
                    <button className="btn sm" type="button" onClick={() => setActiveScreen('analise-projeto')}>
                      Abrir análise
                    </button>
                  </div>
                </>
              )}

              {/* TELA: ANÁLISE DE PROJETO COM IA */}
              {activeScreen === 'analise-projeto' && (
                <ProjectAnalyzer
                  onOpenQuote={qid => setActiveScreen(`cotacao:${qid}`)}
                  onOpenSupplier={name => openProfileByName(name)}
                />
              )}

              {/* TELA: MENSAGENS */}
              {activeScreen === 'msgs' && (
                <>
                  <div className="policy">
                    <Svg k="shield" s={16} />
                    <div><b>Negocie e pague pela OFIR.</b> Só contratos fechados aqui têm pagamento protegido e suporte em caso de problema.</div>
                  </div>
                  {quotes.length > 0 && (
                    <button className="cot-row" onClick={() => setActiveScreen('cotacoes')}>
                      <span className="txt"><b>Cotações enviadas</b><small>Acompanhe os pedidos de cotação feitos a vários fornecedores</small></span>
                      <span className="cot-pill wait">{quotes.length}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  )}
                  {conversations.map(c => {
                    const lastMsg = [...c.msgs].reverse().find(m => !['sys', 'ask'].includes(m.t));
                    const lastText = lastMsg ? (lastMsg.t === 'prop' ? 'Enviou uma proposta de pagamento' : lastMsg.x || lastMsg.name || '') : '';
                    const cd = calcQuoteCountdown(c);
                    return (
                      <button key={c.id} className="conv" onClick={() => setActiveScreen(`chat:${c.id}`)}>
                        <span className={`av media ${c.m}`}></span>
                        <span className="txt">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <b>{c.n}</b>
                            {cd.hasProposal ? (
                              <span className="conv-clock-pill done"><Svg k="check" s={11} /> Proposta</span>
                            ) : cd.isExpired ? (
                              <span className="conv-clock-pill expired"><Svg k="clock" s={11} /> Expirado</span>
                            ) : (
                              <span className="conv-clock-pill active"><Svg k="clock" s={11} /> {cd.hours}h {cd.minutes}m</span>
                            )}
                          </div>
                          <p>{lastText}</p>
                        </span>
                        <span className="side">{c.time}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* TELA: COTAÇÕES */}
              {activeScreen === 'cotacoes' && (
                <>
                  <div className="policy">
                    <Svg k="shield" s={16} />
                    <div><b>Peça cotação a vários fornecedores de uma vez.</b> Selecione fornecedores na busca, anexe o projeto uma vez e compare as propostas aqui.</div>
                  </div>
                  {quotes.map(q => (
                    <button key={q.id} className="cot-row" onClick={() => setActiveScreen(`cotacao:${q.id}`)}>
                      <span className="txt">
                        <b>{q.label}</b>
                        <small>{q.id} · {q.created} · {q.items.length} fornecedores</small>
                      </span>
                      {q.cancelled ? (
                        <span className="cot-pill" style={{ background: 'rgba(180,35,24,.12)', color: 'var(--warn)' }}>Cancelada</span>
                      ) : (
                        <span className="cot-pill recv">{q.items.length} respostas</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  ))}
                </>
              )}

              {/* TELA: DETALHE DA COTAÇÃO */}
              {activeScreen?.startsWith('cotacao:') && (() => {
                const qid = activeScreen.split(':')[1];
                const q = quotes.find(x => x.id === qid);
                if (!q) return <p className="pf-note">Cotação não encontrada.</p>;
                const cancelInfo = calc24hCancellation(q.createdAtMs, q.created);

                return (
                  <>
                    {q.cancelled ? (
                      <div className="policy" style={{ background: 'rgba(180,35,24,.08)', borderColor: 'rgba(180,35,24,.25)', color: 'var(--text)' }}>
                        <Svg k="x" s={18} c="var(--warn)" />
                        <div>
                          <b style={{ color: 'var(--warn)' }}>Cotação cancelada pelo cliente.</b>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                            {q.cancelReason || 'Solicitação de orçamento cancelada dentro do prazo.'}
                          </p>
                        </div>
                      </div>
                    ) : cancelInfo.canCancel ? (
                      <div className="policy" style={{ background: 'rgba(23,74,64,.08)', borderColor: 'var(--accent)' }}>
                        <Svg k="shield" s={18} c="var(--accent)" />
                        <div style={{ flex: 1 }}>
                          <b>Garantia de 24h para desistência ou alteração</b>
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                            Você pode cancelar ou excluir esta cotação a qualquer momento nas primeiras 24 horas. Restam <b>{cancelInfo.formattedRemaining}</b>.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <p className="sec-label">Fornecedores cotados ({q.items.length})</p>
                    {q.items.map(it => {
                      const sup = SUPPLIERS.find(s => s.n === it.sup);
                      const conv = conversations.find(c => c.n === it.sup);
                      return (
                        <div key={it.sup} className="cot-sup">
                          <span className={`av media ${sup?.m || 'm1'}`}></span>
                          <span className="txt"><b>{it.sup}</b><small>{sup ? stageName(sup.e) : ''}</small></span>
                          <span className="r">
                            <button className="link" onClick={() => conv && setActiveScreen(`chat:${conv.id}`)}>Abrir conversa</button>
                          </span>
                        </div>
                      );
                    })}

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {!q.cancelled && cancelInfo.canCancel && (
                        <button
                          type="button"
                          className="ghost danger"
                          style={{ color: 'var(--warn)', borderColor: 'rgba(180,35,24,.3)' }}
                          onClick={() => {
                            if (window.confirm('Deseja cancelar esta cotação? Seus fornecedores serão avisados da desistência.')) {
                              cancelQuote(q.id, 'Desistência em até 24h');
                              toast('Cotação cancelada', 'A cotação foi cancelada com sucesso.');
                            }
                          }}
                        >
                          Cancelar cotação (desistência 24h)
                        </button>
                      )}
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          if (window.confirm('Deseja excluir esta cotação permanentemente?')) {
                            deleteQuote(q.id);
                            toast('Cotação excluída', 'A cotação foi removida.');
                            setActiveScreen('cotacoes');
                          }
                        }}
                      >
                        Excluir cotação
                      </button>
                    </div>
                  </>
                );
              })()}

              {/* TELA: CHAT */}
              {activeScreen?.startsWith('chat:') && (() => {
                const cid = activeScreen.split(':')[1];
                const c = conversations.find(x => x.id === cid);
                if (!c) return <p>Conversa não encontrada.</p>;
                return (
                  <>
                    <WebQuoteCountdown conv={c} />
                    <div className="day">Hoje</div>
                    {c.msgs.map((m, idx) => {
                      if (m.t === 'sys') return <div key={idx} className="sys">{m.x}</div>;
                      if (m.t === 'ask') return (
                        <div key={idx} className="ask">
                          <b>Envie o projeto arquitetônico</b>
                          <p>O fornecedor usa o projeto para fazer a cotação. Aceita PDF, DWG, DXF, Revit, SketchUp, imagens ou ZIP.</p>
                          <button className="btn sm" type="button" onClick={() => fileInputRef.current?.click()}>Anexar projeto</button>
                        </div>
                      );
                      if (m.t === 'file') return (
                        <div key={idx} className={`file ${m.me ? 'me' : 'them'}`}>
                          <span className="fi">PDF</span>
                          <span style={{ minWidth: 0 }}><b>{m.name}</b><small>{m.size} · {m.h}</small></span>
                        </div>
                      );
                      if (m.t === 'prop') {
                        const prop = proposals[m.id!];
                        if (!prop) return null;
                        const tot = prop.rows.reduce((acc, r) => acc + r[1], 0);
                        return (
                          <div key={idx} className="prop">
                            <div className="prop-head">
                              <span className="eyebrow">Solicitação de pagamento</span>
                              <span className={`pill ${prop.status === 'open' ? '' : 'ok'}`}>
                                {prop.status === 'open' ? 'Aguardando você' : 'Contrato fechado'}
                              </span>
                            </div>
                            <h4>{prop.title}</h4>
                            <p className="pm">{prop.meta}</p>
                            <div className="rows">
                              {prop.rows.map(r => (
                                <div key={r[0]}><span>{r[0]}</span><b>R$ {r[1].toLocaleString('pt-BR')}</b></div>
                              ))}
                              <div className="tot"><span>Total</span><b>R$ {tot.toLocaleString('pt-BR')}</b></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 11.5, color: 'var(--text-2)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Svg k="shield" s={12} color="var(--accent)" />
                                <b>Validade legal da proposta:</b> 10 dias (Art. 40, § 2º do CDC)
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Svg k="check" s={12} color="var(--accent)" />
                                <b>Garantia legal da obra:</b> 5 anos de solidez e segurança (Art. 618 do Código Civil)
                              </span>
                            </div>
                            {prop.status === 'open' ? (
                              <div className="prop-acts">
                                <button
                                  className="ghost"
                                  type="button"
                                  onClick={() => {
                                    setChatInput('Gostaria de negociar os valores e prazos desta proposta.');
                                    const el = document.getElementById('composer-in');
                                    if (el) el.focus();
                                  }}
                                >
                                  Negociar
                                </button>
                                <button className="btn" type="button" onClick={() => acceptProposal(prop.id)}>Aceitar e pagar</button>
                              </div>
                            ) : (
                              <div className="escrow"><b>R$ {tot.toLocaleString('pt-BR')} protegido.</b> A etapa 1 é liberada ao fornecedor quando você confirmar que foi concluída.</div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className={`msg ${m.t}`}>
                          {m.x}
                          <time>{m.h}</time>
                        </div>
                      );
                    })}
                  </>
                );
              })()}

              {/* TELA: ORÇAMENTO */}
              {activeScreen === 'orc' && (
                <>
                  <input className="orc-name" value={orcName} onChange={e => setOrcName(e.target.value)} aria-label="Nome do orçamento" />
                  <button className="addr-line" onClick={() => setActiveScreen('enderecos')}>
                    <Svg k="pin" s={18} sw={1.8} />
                    <span>
                      {curAddress ? (
                        <><b>Entregar em: {curAddress.label}</b>{curAddress.street}, {curAddress.num} · {curAddress.city}/{curAddress.uf}</>
                      ) : (
                        <><b>Adicionar endereço de entrega</b>Os fornecedores são filtrados pela região de entrega</>
                      )}
                    </span>
                    <span className="chg">{curAddress ? 'Trocar' : 'Adicionar'}</span>
                  </button>

                  {items.length === 0 ? (
                    <div className="empty-s">
                      <div className="empty-circle">
                        <Icon k="orc" s={38} color="var(--accent)" />
                      </div>
                      <b>Seu orçamento está vazio</b>
                      Adicione serviços com preço nos perfis dos fornecedores para cotar e contratar etapas da sua obra.
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                        <button className="btn sm" onClick={() => { setFilters({ seg: 'svc', stage: 'all' }); setActiveScreen(null); }}>Ver serviços</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {groups.map(g => (
                        <div key={g.sup} className={`og ${g.ok ? '' : 'bad'}`}>
                          <div className="og-head">
                            <span className={`av media ${g.x.m}`}></span>
                            <div><b>{g.sup}</b><small>{stageName(g.x.e)} · {g.x.c}</small></div>
                            {!g.ok && <span className="pill warn">Não atende neste endereço</span>}
                          </div>
                          <table className="ot items">
                            <thead>
                              <tr>
                                <th>Item / Etapa</th><th>Qtd</th><th className="num">Unitário</th><th className="num">Subtotal</th><th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.items.map(i => (
                                <tr key={i.id}>
                                  <td>{i.n}<small>Serviço · {i.un}</small></td>
                                  <td>{i.qty}</td>
                                  <td className="num">{BRLc(i.p)}</td>
                                  <td className="num">{BRLc(i.p * i.qty)}</td>
                                  <td className="num">
                                    <button className="rm" onClick={() => removeItem(i.id)}>
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="og-foot">
                            <span>Contratação de serviço com custódia</span>
                            <span>Total do fornecedor <b>{BRLc(g.total)}</b></span>
                          </div>
                        </div>
                      ))}

                      <div className="sum rows">
                        <div><span>Serviços e Etapas</span><b>{BRLc(totals.svc)}</b></div>
                        <div className="tot"><span>Total do orçamento</span><b>{BRLc(totals.total)}</b></div>
                      </div>
                      <div className="policy" style={{ marginTop: 12 }}>
                        <Svg k="shield" s={16} />
                        <div>
                          <b>Conformidade Legal do Orçamento:</b> Discriminação prévia e validade garantida de 10 dias (Art. 40 do CDC) e garantia legal de 5 anos para solidez e segurança de obras civis (Art. 618 do Código Civil).
                        </div>
                      </div>
                      <p className="pf-note">{groups.length} {groups.length > 1 ? 'fornecedores' : 'fornecedor'} · na contratação, cada fornecedor vira um contrato com custódia por etapa.</p>
                    </>
                  )}
                </>
              )}

              {/* TELA: ENDEREÇOS */}
              {activeScreen === 'enderecos' && (
                <>
                  {addresses.map(a => (
                    <label key={a.id} className={`addr-opt ${a.id === addrSel ? 'on' : ''}`}>
                      <input type="radio" name="addr" value={a.id} checked={a.id === addrSel} onChange={() => selectAddress(a.id)} />
                      <div className="addr-info">
                        <b>{a.label}</b>
                        <small>{a.street}, {a.num} {a.comp ? `· ${a.comp}` : ''} · {a.hood}, {a.city}/{a.uf}</small>
                        <small>CEP {a.cep}</small>
                      </div>
                      <div className="addr-acts">
                        <button
                          className="addr-act-btn"
                          type="button"
                          title="Editar endereço"
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditAddrId(a.id);
                            setAddrForm({ ...a, comp: a.comp || '', hood: a.hood || '' });
                            setCepStatus('idle');
                            setCepFeedback('');
                            setAddrFormErrors({});
                            document.getElementById('addr-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                        </button>
                        <button
                          className="addr-act-btn del"
                          type="button"
                          title="Excluir endereço"
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteAddress(a.id);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
                        </button>
                      </div>
                    </label>
                  ))}

                  <p className="sec-label">{editAddrId ? 'Editar endereço' : 'Novo endereço'}</p>
                  <form className="form-grid" id="addr-form" onSubmit={handleAddrSubmit}>
                    <div className={`inp c2 ${addrFormErrors.cep ? 'bad' : ''}`}>
                      <label htmlFor="addr-cep">CEP</label>
                      <div className="cep-input-wrap">
                        <input
                          id="addr-cep"
                          value={addrForm.cep}
                          onChange={e => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          inputMode="numeric"
                          autoComplete="postal-code"
                        />
                        {cepStatus === 'loading' && (
                          <span className="cep-status-icon">
                            <span className="cep-spin" />
                          </span>
                        )}
                        {cepStatus === 'success' && (
                          <span className="cep-status-icon ok" title="Endereço localizado">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-10" /></svg>
                          </span>
                        )}
                        {cepStatus === 'error' && (
                          <span className="cep-status-icon err" title="CEP não encontrado">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6 6 18" /></svg>
                          </span>
                        )}
                      </div>
                      {cepFeedback ? (
                        <small className={`cep-info ${cepStatus === 'success' ? 'ok' : cepStatus === 'error' ? 'err' : ''}`}>
                          {cepFeedback}
                        </small>
                      ) : (
                        <small className="hint">Preenche o endereço automaticamente</small>
                      )}
                      {addrFormErrors.cep && <small className="err">{addrFormErrors.cep}</small>}
                    </div>

                    <div className={`inp c4 ${addrFormErrors.street ? 'bad' : ''}`}>
                      <label htmlFor="addr-street">Rua / Logradouro</label>
                      <input
                        id="addr-street"
                        value={addrForm.street}
                        onChange={e => {
                          setAddrForm({ ...addrForm, street: e.target.value });
                          if (e.target.value) setAddrFormErrors(prev => ({ ...prev, street: '' }));
                        }}
                        placeholder="Ex: Av. Paulista, Rua das Flores"
                        autoComplete="address-line1"
                        list="addr-street-types"
                      />
                      <datalist id="addr-street-types">
                        <option value="Rua " />
                        <option value="Avenida " />
                        <option value="Alameda " />
                        <option value="Estrada " />
                        <option value="Rodovia " />
                        <option value="Travessa " />
                        <option value="Praça " />
                      </datalist>
                      {addrFormErrors.street && <small className="err">{addrFormErrors.street}</small>}
                    </div>

                    <div className={`inp c2 ${addrFormErrors.num ? 'bad' : ''}`}>
                      <label htmlFor="addr-num">Número</label>
                      <input
                        id="addr-num"
                        value={addrForm.num}
                        onChange={e => {
                          setAddrForm({ ...addrForm, num: e.target.value });
                          if (e.target.value) setAddrFormErrors(prev => ({ ...prev, num: '' }));
                        }}
                        placeholder="Ex: 120 ou S/N"
                        autoComplete="address-line2"
                      />
                      {addrFormErrors.num && <small className="err">{addrFormErrors.num}</small>}
                    </div>

                    <div className="inp c4">
                      <label htmlFor="addr-comp">Complemento (opcional)</label>
                      <input
                        id="addr-comp"
                        value={addrForm.comp}
                        onChange={e => setAddrForm({ ...addrForm, comp: e.target.value })}
                        placeholder="Ex: Apto 42, Bloco B, Lote 14"
                        autoComplete="address-line3"
                      />
                      <div className="quick-chips-wrap">
                        <span className="quick-chips-label">Sugestões:</span>
                        {['Lote', 'Casa', 'Apto', 'Bloco', 'Galpão', 'Sala'].map(chip => (
                          <button
                            key={chip}
                            type="button"
                            className="quick-chip"
                            onClick={() => {
                              const current = addrForm.comp.trim();
                              const next = current ? `${current}, ${chip} ` : `${chip} `;
                              setAddrForm({ ...addrForm, comp: next });
                            }}
                          >
                            +{chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="inp c6">
                      <label htmlFor="addr-hood">Bairro</label>
                      <input
                        id="addr-hood"
                        value={addrForm.hood}
                        onChange={e => setAddrForm({ ...addrForm, hood: e.target.value })}
                        placeholder="Ex: Jardim Paulista, Centro"
                        autoComplete="address-level3"
                      />
                    </div>

                    <CustomSelect
                      id="addr-uf"
                      className="c2"
                      label="UF"
                      value={addrForm.uf}
                      onChange={val => {
                        setAddrForm(prev => ({
                          ...prev,
                          uf: val,
                          city: prev.uf !== val ? '' : prev.city
                        }));
                        if (val) setAddrFormErrors(prev => ({ ...prev, uf: '' }));
                      }}
                      options={ufOptions}
                      placeholder="UF"
                      searchPlaceholder="Buscar estado (ex: SP, RJ)..."
                      error={addrFormErrors.uf}
                      autoComplete="address-level1"
                      required
                    />

                    <CustomSelect
                      id="addr-city"
                      className="c4"
                      label="Cidade"
                      value={addrForm.city}
                      onChange={val => {
                        setAddrForm(prev => ({ ...prev, city: val }));
                        if (val) setAddrFormErrors(prev => ({ ...prev, city: '' }));
                      }}
                      options={cityOptions}
                      placeholder={addrForm.uf ? 'Buscar ou selecionar cidade' : 'Selecione primeiro a UF'}
                      searchPlaceholder="Digite o nome da cidade..."
                      disabled={!addrForm.uf && cityOptions.length === 0}
                      loading={loadingCities}
                      allowCustomInput={true}
                      error={addrFormErrors.city}
                      autoComplete="address-level2"
                      required
                    />

                    <div className="inp c6">
                      <label>Identificação do local</label>
                      <div className="lbl-chips">
                        {['Obra', 'Casa', 'Trabalho', 'Depósito', 'Outro'].map(l => (
                          <button
                            key={l}
                            type="button"
                            className={addrForm.label === l ? 'on' : ''}
                            onClick={() => setAddrForm({ ...addrForm, label: l })}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="inp c6" style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {editAddrId && (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => {
                            setEditAddrId(null);
                            setAddrForm({ label: 'Obra', cep: '', street: '', num: '', comp: '', hood: '', city: '', uf: '' });
                            setCepStatus('idle');
                            setCepFeedback('');
                            setAddrFormErrors({});
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                      <button className="btn lg block" type="submit">
                        {editAddrId ? 'Salvar alterações' : 'Salvar endereço'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* TELA: FINALIZAR COMPRA (CHECKOUT COM SPLIT E TAXA DA PLATAFORMA) */}
              {activeScreen === 'checkout' && (() => {
                const okGroups = groups.filter(g => g.ok);
                const outGroups = groups.filter(g => !g.ok);
                return (
                  <>
                    <p className="sec-label">Endereço de entrega</p>
                    {addresses.map(a => (
                      <label key={a.id} className={`addr-opt ${a.id === addrSel ? 'on' : ''}`}>
                        <input type="radio" name="ck-addr" value={a.id} checked={a.id === addrSel} onChange={() => selectAddress(a.id)} />
                        <div className="addr-info">
                          <b>{a.label}</b>
                          <small>{a.street}, {a.num} · {a.city}/{a.uf} · CEP {a.cep}</small>
                        </div>
                      </label>
                    ))}
                    <button className="ghost block" onClick={() => setActiveScreen('enderecos')}>Adicionar outro endereço</button>

                    <p className="sec-label">Pedidos que serão gerados</p>
                    {okGroups.length > 0 ? (
                      okGroups.map((g, idx) => (
                        <div key={g.sup} className="ord" style={{ cursor: 'default' }}>
                          <span className={`av media ${g.x.m}`} style={{ width: 40, height: 40, borderRadius: 10 }}></span>
                          <span className="txt">
                            <span className="ord-num">Pedido {idx + 1} de {okGroups.length}</span>
                            <b>{g.sup}</b>
                            <small>{g.items.length} {g.items.length > 1 ? 'itens/etapas' : 'item/etapa'} · liberado por etapa concluída</small>
                          </span>
                          <span className="r"><b>{BRLc(g.total)}</b></span>
                        </div>
                      ))
                    ) : (
                      <p className="pf-note">Nenhum fornecedor do orçamento atende este endereço.</p>
                    )}

                    {outGroups.length > 0 && (
                      <div className="policy" style={{ background: 'rgba(180,35,24,.06)', borderColor: 'rgba(180,35,24,.2)' }}>
                        <Svg k="x" s={16} color="var(--warn)" />
                        <div><b>Fora deste pedido:</b> {outGroups.map(g => g.sup).join(', ')}. Não atendem em {curAddress?.city || 'este endereço'}; os itens continuam no orçamento.</div>
                      </div>
                    )}

                    <p className="sec-label">Forma de pagamento</p>
                    <div className="methods" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        ['pix', 'Pix', 'à vista'],
                        ['card', 'Cartão', 'até 12x'],
                        ['boleto', 'Boleto', '1 dia útil']
                      ].map(([m, label, sub]) => (
                        <button
                          key={m}
                          type="button"
                          className={payMethod === m ? 'on' : ''}
                          onClick={() => setPayMethod(m as any)}
                          style={{
                            padding: '10px 8px',
                            border: `1.5px solid ${payMethod === m ? 'var(--accent)' : 'var(--line)'}`,
                            background: payMethod === m ? 'rgba(23,74,64,.08)' : 'var(--surface)',
                            borderRadius: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <b style={{ fontSize: 14 }}>{label}</b>
                          <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</span>
                        </button>
                      ))}
                    </div>

                    <p className="sec-label">Como o pagamento é dividido (Custódia e Split)</p>
                    <table className="ot split-t" style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12 }}>Fornecedor</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Valor</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Taxa OFIR (3%)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Recebe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {okGroups.map(g => (
                          <tr key={g.sup} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <b>{g.sup}</b>
                              <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                                liberado por etapa concluída
                              </small>
                            </td>
                            <td data-l="Valor" style={{ padding: '10px 12px', textAlign: 'right' }}>{BRLc(g.total)}</td>
                            <td data-l="Taxa OFIR (3%)" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{BRLc(Math.round(g.total * 0.03))}</td>
                            <td data-l="Recebe" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{BRLc(Math.round(g.total * 0.97))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="pf-note" style={{ marginTop: 8 }}>
                      Você faz um único pagamento. A OFIR separa o valor de cada fornecedor, guarda em custódia e libera conforme a conclusão de cada etapa da obra. A taxa sai da parte do fornecedor.
                    </p>

                    <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <small style={{ color: 'var(--muted)', display: 'block', fontSize: 12 }}>Total a pagar</small>
                        <b style={{ fontSize: 20, color: 'var(--accent)' }}>{BRLc(totals.total)}</b>
                      </div>
                      <button
                        className="btn lg"
                        disabled={okGroups.length === 0 || isPaying}
                        onClick={() => {
                          setIsPaying(true);
                          setTimeout(() => {
                            checkout(payMethod);
                            setIsPaying(false);
                            setActiveScreen('paid');
                          }, 900);
                        }}
                      >
                        {isPaying ? 'Processando pagamento...' : `Pagar ${BRLc(totals.total)}`}
                      </button>
                    </div>
                  </>
                );
              })()}

              {/* TELA: PAGAMENTO APROVADO */}
              {activeScreen === 'paid' && (
                <>
                  <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(31,122,85,.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ok)', marginBottom: 12 }}>
                      <Svg k="check" s={36} color="var(--ok)" sw={2.5} />
                    </div>
                    <h2 className="display" style={{ fontSize: 26 }}>Compra realizada</h2>
                    <p className="pf-note" style={{ marginTop: 4 }}>
                      Pagamento {lastCheckout?.pay || 'PAG-2026-00041'} · {BRLc(lastCheckout?.orders?.reduce((s, o) => s + o.total, 0) || totals.total)} · {payMethod.toUpperCase()}
                    </p>
                  </div>

                  <p className="sec-label">
                    {lastCheckout?.orders?.length || 1} {(lastCheckout?.orders?.length || 1) > 1 ? 'pedidos gerados' : 'pedido gerado'}
                  </p>
                  {(lastCheckout?.orders || []).map(o => (
                    <div key={o.id} className="ord" onClick={() => setActiveScreen(`ped:${o.id}`)} style={{ cursor: 'pointer' }}>
                      <span className={`av media ${SUPPLIERS.find(s => s.n === o.sup)?.m || 'm1'}`} style={{ width: 40, height: 40, borderRadius: 10 }}></span>
                      <span className="txt">
                        <span className="ord-num">{o.id}</span>
                        <b>{o.sup}</b>
                        <small>{o.created} · {o.items?.length || 1} itens · {o.addr?.label || 'Obra'}</small>
                      </span>
                      <span className="r">
                        <b>{BRLc(o.total)}</b>
                        <span className="pill">{o.status}</span>
                      </span>
                    </div>
                  ))}

                  <p className="pf-note" style={{ marginTop: 12 }}>
                    Cada fornecedor recebeu o pedido dele. Acompanhe entregas e etapas em Pedidos.
                  </p>
                  <button className="btn lg block" style={{ marginTop: 16 }} onClick={() => setActiveScreen('hist')}>
                    Ver meus pedidos
                  </button>
                </>
              )}

              {/* TELA: DETALHE DO PEDIDO */}
              {activeScreen?.startsWith('ped:') && (() => {
                const oid = activeScreen.split(':')[1];
                const o = orders.find(x => x.id === oid);
                if (!o) return <p className="pf-note">Pedido não encontrado.</p>;
                const sup = SUPPLIERS.find(s => s.n === o.sup);
                const conv = conversations.find(c => c.n === o.sup);
                const cancelInfo = calc24hCancellation(o.createdAtMs, o.created);

                return (
                  <>
                    <div className="panel" style={{ gap: 8 }}>
                      <span className={`pill ${o.cancelled ? 'warn' : o.done ? 'ok' : ''}`} style={{ alignSelf: 'flex-start', ...(o.cancelled ? { background: 'rgba(180,35,24,.12)', color: 'var(--warn)' } : {}) }}>
                        {o.cancelled ? 'Cancelado · Reembolsado' : o.status}
                      </span>
                      <p className="meta" style={{ marginTop: 4 }}>{o.release}</p>
                    </div>

                    {o.cancelled ? (
                      <div className="policy" style={{ background: 'rgba(180,35,24,.08)', borderColor: 'rgba(180,35,24,.25)', color: 'var(--text)' }}>
                        <Svg k="x" s={18} c="var(--warn)" />
                        <div>
                          <b style={{ color: 'var(--warn)' }}>Pedido cancelado pelo cliente.</b>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                            {o.cancelReason || 'Cancelado por desistência em até 24h.'} O estorno integral de 100% foi solicitado automaticamente.
                          </p>
                        </div>
                      </div>
                    ) : !o.done && cancelInfo.canCancel ? (
                      <div className="policy" style={{ background: 'rgba(23,74,64,.08)', borderColor: 'var(--accent)' }}>
                        <Svg k="shield" s={18} c="var(--accent)" />
                        <div style={{ flex: 1 }}>
                          <b>Garantia de desistência OFIR em 24h</b>
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                            Você pode desistir desta compra e receber reembolso integral sem custos. Tempo restante para cancelamento: <b>{cancelInfo.formattedRemaining}</b>.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="og">
                      <div className="og-head">
                        <span className={`av media ${sup?.m || 'm1'}`}></span>
                        <div>
                          <b>{o.sup}</b>
                          <small>{sup ? stageName(sup.e) : ''} · {sup?.c || ''}</small>
                        </div>
                      </div>
                      <table className="ot items">
                        <thead>
                          <tr>
                            <th>Item</th><th>Qtd</th><th className="num">Unitário</th><th className="num">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(o.items || []).map((i, idx) => (
                            <tr key={idx}>
                              <td>{i.n}<small>{i.un}</small></td>
                              <td>{i.qty}</td>
                              <td className="num">{BRLc(i.p)}</td>
                              <td className="num">{BRLc(i.p * i.qty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="og-foot">
                        <span>Frete {BRLc(o.frete || 0)}</span>
                        <span>Total <b>{BRLc(o.total)}</b></span>
                      </div>
                    </div>

                    <p className="sec-label">Entrega</p>
                    <div className="addr-line" style={{ cursor: 'default' }}>
                      <Svg k="pin" s={18} sw={1.8} />
                      <span>
                        <b>{o.addr?.label || 'Obra'}</b>
                        {o.addr ? `${o.addr.street}, ${o.addr.num} · ${o.addr.city}/${o.addr.uf} · CEP ${o.addr.cep}` : 'Endereço da obra'}
                      </span>
                    </div>

                    <p className="sec-label">Pagamento e Divisão da Taxa</p>
                    <div className="sum rows">
                      <div><span>Pagamento</span><b>{o.pay}</b></div>
                      <div><span>Forma</span><b>{o.method}</b></div>
                      <div><span>Data</span><b>{o.created}</b></div>
                      <div><span>Fornecedor recebe (97%)</span><b>{BRLc(o.total - o.fee)}</b></div>
                      <div><span>Taxa OFIR (3%)</span><b style={{ color: 'var(--accent)' }}>{BRLc(o.fee)}</b></div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                      <button className="ghost sq" title="Falar com o fornecedor" onClick={() => {
                        let cid = conv?.id;
                        if (!cid && sup) cid = startQuote(sup, false);
                        if (cid) setActiveScreen(`chat:${cid}`);
                      }}>
                        <Svg k="msg" s={18} />
                      </button>
                      {!o.done && !o.cancelled && (
                        <button className="btn block" style={{ flex: 1 }} onClick={() => confirmOrder(o.id)}>
                          Confirmar conclusão da etapa
                        </button>
                      )}
                      {!o.done && !o.cancelled && cancelInfo.canCancel && (
                        <button
                          type="button"
                          className="ghost danger"
                          style={{ color: 'var(--warn)', borderColor: 'rgba(180,35,24,.3)' }}
                          onClick={() => {
                            if (window.confirm('Tem certeza de que deseja cancelar este pedido? De acordo com a garantia de 24h, o estorno integral de 100% será processado imediatamente.')) {
                              cancelOrder(o.id, 'Desistência do cliente dentro da garantia de 24 horas');
                              toast('Pedido cancelado', 'Estorno integral de 100% solicitado com sucesso.');
                            }
                          }}
                        >
                          Cancelar pedido (desistência 24h)
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* TELA: HISTÓRICO DE PEDIDOS */}
              {activeScreen === 'hist' && (
                <>
                  <p className="sec-label">Pedidos realizados ({orders.length})</p>
                  {orders.length === 0 ? (
                    <p className="pf-note">Nenhum pedido finalizado ainda.</p>
                  ) : (
                    orders.map(o => (
                      <div key={o.id} className="ord" onClick={() => setActiveScreen(`ped:${o.id}`)} style={{ cursor: 'pointer' }}>
                        <div>
                          <b>{o.id} · {o.sup}</b>
                          <small>{o.created} · {o.method.toUpperCase()} · Taxa OFIR {BRLc(o.fee)} (protegida)</small>
                        </div>
                        <span className={`pill ${o.cancelled ? 'warn' : o.done ? 'ok' : ''}`} style={o.cancelled ? { background: 'rgba(180,35,24,.12)', color: 'var(--warn)' } : {}}>
                          {o.cancelled ? 'Cancelado' : BRLc(o.total)}
                        </span>
                      </div>
                    ))
                  )}

                  <p className="sec-label" style={{ marginTop: 24 }}>Cotações em andamento ({quotes.length})</p>
                  {quotes.length === 0 ? (
                    <p className="pf-note">Nenhuma cotação no momento.</p>
                  ) : (
                    quotes.map(q => (
                      <div key={q.id} className="ord" onClick={() => setActiveScreen(`cotacao:${q.id}`)} style={{ cursor: 'pointer' }}>
                        <div>
                          <b>{q.id} · {q.label}</b>
                          <small>{q.created} · {q.items.length} fornecedores consultados</small>
                        </div>
                        <span className="pill wait" style={q.cancelled ? { background: 'rgba(180,35,24,.12)', color: 'var(--warn)' } : {}}>
                          {q.cancelled ? 'Cancelada' : 'Em análise'}
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* TELA: PERFIL DO USUÁRIO & CADASTRO COMPLETO */}
              {activeScreen === 'perfil' && (
                <>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleAvatarFile}
                  />

                  {/* Cabeçalho do Perfil com Foto Real / Avatar */}
                  <div className="pf-head" style={{ alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', flex: 'none' }}>
                      {userForm.avatar ? (
                        <img
                          src={userForm.avatar}
                          alt="Foto de perfil"
                          style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--accent)' }}
                        />
                      ) : (
                        <span className="avatar-btn" style={{ width: 68, height: 68, fontSize: 24 }}>
                          {initials(userForm.name || 'Eduardo Castro')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          color: '#fff',
                          border: '2px solid var(--surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                        }}
                        title="Adicionar ou alterar foto de perfil"
                      >
                        <Svg k="camera" s={14} color="#fff" />
                      </button>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 18, lineHeight: 1.2 }}>{userForm.name || 'Eduardo Castro'}</b>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{userForm.email || 'eduardo@ofir.com.br'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span className="pill">{userForm.role === 'supplier' ? 'Fornecedor' : 'Proprietário da Obra'}</span>
                        <button
                          type="button"
                          className="link"
                          style={{ fontSize: 12, padding: 0 }}
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          Trocar foto
                        </button>
                        {userForm.avatar && (
                          <button
                            type="button"
                            className="link"
                            style={{ fontSize: 12, padding: 0, color: 'var(--warn)' }}
                            onClick={() => {
                              setUserForm(prev => ({ ...prev, avatar: '' }));
                              updateUser({ avatar: '' });
                              toast('Foto removida!');
                            }}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FORMULÁRIO DE CADASTRO COMPLETO DO USUÁRIO */}
                  <div className="profile-form-box">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        updateUser(userForm);
                        // Se o usuário atualizou endereço no perfil, sincroniza o endereço principal também
                        if (userForm.cep && userForm.city) {
                          setAddress({ cep: userForm.cep, city: userForm.city });
                        }
                        toast('Cadastro salvo com sucesso!', 'Seus dados de perfil e localização foram atualizados.');
                      }}
                    >
                      {/* Seletor de Tipo de Conta em Formato Segmentado Full-width */}
                      <span className="profile-section-title">
                        <Svg k="user" s={14} color="var(--accent)" /> Tipo de Conta na Plataforma
                      </span>
                      <div className="profile-role-switcher" role="radiogroup" aria-label="Tipo de conta">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={userForm.role === 'owner'}
                          className={`profile-role-btn ${userForm.role === 'owner' ? 'active' : ''}`}
                          onClick={() => setUserForm({ ...userForm, role: 'owner' })}
                        >
                          <Svg k="home" s={18} color={userForm.role === 'owner' ? 'var(--accent)' : 'currentColor'} />
                          <div>
                            <strong>Proprietário da Obra</strong>
                            <small>Construindo ou reformando</small>
                          </div>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={userForm.role === 'supplier'}
                          className={`profile-role-btn ${userForm.role === 'supplier' ? 'active' : ''}`}
                          onClick={() => setUserForm({ ...userForm, role: 'supplier' })}
                        >
                          <Svg k="building" s={18} color={userForm.role === 'supplier' ? 'var(--accent)' : 'currentColor'} />
                          <div>
                            <strong>Fornecedor Credenciado</strong>
                            <small>Materiais e serviços B2B</small>
                          </div>
                        </button>
                      </div>

                      {/* Seção 1: Dados Pessoais */}
                      <span className="profile-section-title">
                        <Svg k="doc" s={14} color="var(--accent)" /> Dados Pessoais
                      </span>
                      <div className="profile-grid">
                        <div className="inp full">
                          <label htmlFor="pf-name">Nome completo</label>
                          <input
                            id="pf-name"
                            value={userForm.name}
                            onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                            placeholder="Seu nome completo"
                            required
                            autoComplete="name"
                          />
                        </div>

                        <div className="inp">
                          <label htmlFor="pf-email">E-mail corporativo / pessoal</label>
                          <input
                            id="pf-email"
                            type="email"
                            value={userForm.email}
                            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                          />
                        </div>

                        <div className="inp">
                          <label htmlFor="pf-phone">Telefone / WhatsApp</label>
                          <input
                            id="pf-phone"
                            value={userForm.phone}
                            onChange={e => handlePhoneChange(e.target.value)}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            inputMode="tel"
                            autoComplete="tel"
                          />
                        </div>

                        <div className="inp full">
                          <label htmlFor="pf-cpf">CPF ou CNPJ</label>
                          <input
                            id="pf-cpf"
                            value={userForm.cpfCnpj}
                            onChange={e => handleCpfCnpjChange(e.target.value)}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            maxLength={18}
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      {/* Seção 2: Localização & Endereço com Busca Automática por CEP */}
                      <span className="profile-section-title">
                        <Svg k="pin" s={14} color="var(--accent)" /> Localização & Endereço Principal
                      </span>
                      <div className="profile-grid">
                        <div className="inp">
                          <label htmlFor="pf-cep">CEP</label>
                          <div className="cep-input-wrap">
                            <input
                              id="pf-cep"
                              value={userForm.cep}
                              onChange={e => handleProfileCepChange(e.target.value)}
                              placeholder="00000-000"
                              maxLength={9}
                              inputMode="numeric"
                              autoComplete="postal-code"
                            />
                            {profileCepLoading && (
                              <span className="cep-status-icon">
                                <span className="cep-spin" />
                              </span>
                            )}
                            {profileCepStatus === 'success' && (
                              <span className="cep-status-icon ok" title="Endereço localizado">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-10" /></svg>
                              </span>
                            )}
                            {profileCepStatus === 'error' && (
                              <span className="cep-status-icon err" title="CEP não encontrado">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6 6 18" /></svg>
                              </span>
                            )}
                          </div>
                          {profileCepFeedback ? (
                            <small className={`cep-info ${profileCepStatus === 'success' ? 'ok' : profileCepStatus === 'error' ? 'err' : ''}`}>
                              {profileCepFeedback}
                            </small>
                          ) : (
                            <small className="hint">Preenche logradouro e cidade automaticamente</small>
                          )}
                        </div>

                        <div className="inp">
                          <label htmlFor="profile-num">Número</label>
                          <input
                            id="profile-num"
                            value={userForm.num}
                            onChange={e => setUserForm({ ...userForm, num: e.target.value })}
                            placeholder="Ex: 120 ou S/N"
                            autoComplete="address-line2"
                          />
                        </div>

                        <div className="inp full">
                          <label htmlFor="profile-street">Rua / Logradouro</label>
                          <input
                            id="profile-street"
                            value={userForm.street}
                            onChange={e => setUserForm({ ...userForm, street: e.target.value })}
                            placeholder="Ex: Av. Paulista, Rua das Flores"
                            autoComplete="address-line1"
                          />
                        </div>

                        <div className="inp">
                          <label htmlFor="pf-hood">Bairro</label>
                          <input
                            id="pf-hood"
                            value={userForm.hood}
                            onChange={e => setUserForm({ ...userForm, hood: e.target.value })}
                            placeholder="Ex: Jardim do Lago, Centro"
                            autoComplete="address-level3"
                          />
                        </div>

                        <div className="inp">
                          <label htmlFor="pf-comp">Complemento (opcional)</label>
                          <input
                            id="pf-comp"
                            value={userForm.comp}
                            onChange={e => setUserForm({ ...userForm, comp: e.target.value })}
                            placeholder="Ex: Bloco A, Casa 2, Lote 14"
                            autoComplete="address-line3"
                          />
                        </div>

                        <CustomSelect
                          id="pf-uf"
                          label="Estado (UF)"
                          value={userForm.uf}
                          onChange={val => {
                            setUserForm(prev => ({
                              ...prev,
                              uf: val,
                              city: prev.uf !== val ? '' : prev.city
                            }));
                          }}
                          options={ufOptions}
                          placeholder="Selecione a UF"
                          searchPlaceholder="Buscar estado..."
                          autoComplete="address-level1"
                          required
                        />

                        <CustomSelect
                          id="pf-city"
                          label="Cidade"
                          value={userForm.city}
                          onChange={val => setUserForm(prev => ({ ...prev, city: val }))}
                          options={profileCityOptions}
                          placeholder={userForm.uf ? 'Buscar ou selecionar cidade' : 'Selecione primeiro a UF'}
                          searchPlaceholder="Digite o nome da cidade..."
                          disabled={!userForm.uf && profileCityOptions.length === 0}
                          loading={profileLoadingCities}
                          allowCustomInput={true}
                          autoComplete="address-level2"
                          required
                        />
                      </div>

                      {/* Seção 3: Informações Sobre a Obra / Atuação */}
                      <span className="profile-section-title">
                        <Svg k="orc" s={14} color="var(--accent)" /> Sobre Você ou Sua Obra
                      </span>
                      <div className="profile-grid">
                        <div className="inp full">
                          <textarea
                            className="profile-textarea"
                            value={userForm.bio}
                            onChange={e => setUserForm({ ...userForm, bio: e.target.value })}
                            placeholder="Descreva detalhes sobre sua construção, metragem, sistema construtivo preferido ou sua atuação técnica no mercado..."
                            rows={3}
                          />
                        </div>

                        <div className="inp full" style={{ marginTop: 8 }}>
                          <button className="btn lg block" type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46 }}>
                            <Svg k="check" s={16} /> Salvar dados cadastrais
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Acessos Rápidos */}
                  <p className="sec-label" style={{ marginTop: 24 }}>Minha conta e compras</p>
                  <div className="list">
                    <button onClick={() => setActiveScreen('enderecos')}>
                      <span>Endereços de entrega</span>
                      <small>{addresses.length} salvo(s)</small>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button onClick={() => setActiveScreen('hist')}>
                      <span>Pedidos e cotações</span>
                      <small>{orders.length} pedidos</small>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button onClick={() => setActiveScreen('orc')}>
                      <span>Orçamento atual</span>
                      <small>{items.length} itens</small>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>

                  <p className="sec-label" style={{ marginTop: 24 }}>Configurações do aplicativo</p>
                  <div className="switch-item">
                    <div className="switch-item-left">
                      <div className="switch-item-icon">
                        <Svg k={theme === 'dark' ? 'moon' : 'sun'} s={18} />
                      </div>
                      <div>
                        <div className="switch-item-title">Tema escuro</div>
                        <div className="switch-item-desc">Alternar entre modo claro e escuro</div>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-item-left">
                      <div className="switch-item-icon">
                        <Svg k="bell" s={18} />
                      </div>
                      <div>
                        <div className="switch-item-title">Notificações da obra</div>
                        <div className="switch-item-desc">Avisos via WhatsApp e e-mail sobre etapas e cotações</div>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        defaultChecked
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="list" style={{ marginTop: 14 }}>
                    <button type="button" onClick={() => setActiveScreen('sobre')}><span>Central de ajuda e suporte</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg></button>
                    <button type="button" onClick={() => setActiveScreen('conformidade')}><span>Como funciona o pagamento protegido</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg></button>
                  </div>
                  {user ? (
                    <div className="list" style={{ marginTop: 8 }}>
                      <button className="danger" onClick={() => { signOut(); setActiveScreen(null); }}><span>Sair da conta</span></button>
                    </div>
                  ) : null}
                </>
              )}

              {/* TELA: CONFIGURAÇÕES */}
              {activeScreen === 'config' && (
                <>
                  <div style={{ padding: '8px 4px 12px', fontSize: 13, color: 'var(--muted)' }}>
                    Configurações e preferências de visualização
                  </div>

                  <div className="switch-item">
                    <div className="switch-item-left">
                      <div className="switch-item-icon">
                        <Svg k={theme === 'dark' ? 'moon' : 'sun'} s={18} />
                      </div>
                      <div>
                        <div className="switch-item-title">Tema escuro</div>
                        <div className="switch-item-desc">Alternar entre modo claro e escuro</div>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-item">
                    <div className="switch-item-left">
                      <div className="switch-item-icon">
                        <Svg k="bell" s={18} />
                      </div>
                      <div>
                        <div className="switch-item-title">Notificações da obra</div>
                        <div className="switch-item-desc">Alertas de cotações e status</div>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        defaultChecked
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="list" style={{ marginTop: 16 }}>
                    <button type="button" onClick={() => setActiveScreen('notificacoes')}>
                      <span>Notificações da obra</span>
                      {unreadCount > 0 && <span className="notif-count-pill">{unreadCount}</span>}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    {user && (
                      <button type="button" onClick={() => setActiveScreen('perfil')}>
                        <span>Meu perfil</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                      </button>
                    )}
                    <button type="button" onClick={() => setActiveScreen('enderecos')}>
                      <span>Endereços de entrega</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('hist')}>
                      <span>Histórico de pedidos</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('termos')}>
                      <span>Termos de Uso da Plataforma</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('privacidade')}>
                      <span>Privacidade e LGPD</span>
                      <span className="notif-count-pill" style={{ background: 'rgba(23,74,64,0.12)', color: 'var(--accent)' }}>Lei 13.709</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button onClick={() => setActiveScreen('conformidade')}>
                      <span>Conformidade com Leis do Brasil</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                </>
              )}

              {/* TELA: NOTIFICAÇÕES COMPLETAS */}
              {activeScreen === 'notificacoes' && (
                <div className="notif-screen-wrap">
                  {/* Hero / Resumo */}
                  <div className="notif-screen-hero">
                    <div>
                      <h3>
                        <Svg k="bell" s={20} color="var(--accent)" />
                        Central de Notificações
                      </h3>
                      <p>
                        Acompanhe respostas de fornecedores, novos credenciados na sua região e novidades da plataforma OFIR.
                      </p>
                    </div>
                    <div className="notif-screen-stats">
                      <div className="notif-stat-box">
                        <b>{notifications.length}</b>
                        <span>Total</span>
                      </div>
                      <div className="notif-stat-box">
                        <b style={{ color: unreadCount > 0 ? '#e11d48' : 'var(--ok)' }}>{unreadCount}</b>
                        <span>Novas</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Ações & Simulação para Testes */}
                  <div className="notif-screen-toolbar">
                    <div className="notif-sim-row">
                      <span className="notif-sim-label">Simular Notificações:</span>
                      <div className="notif-sim-buttons">
                        <button
                          type="button"
                          className="notif-sim-btn"
                          onClick={simulateSupplierReply}
                          title="Simular recebimento de proposta ou mensagem de fornecedor"
                        >
                          <Svg k="msg" s={13} color="var(--accent)" />
                          Resposta de Fornecedor
                        </button>
                        <button
                          type="button"
                          className="notif-sim-btn"
                          onClick={simulateNewSupplier}
                          title="Simular cadastro de novo fornecedor credenciado"
                        >
                          <Svg k="building" s={13} color="var(--accent)" />
                          Novo Fornecedor
                        </button>
                        <button
                          type="button"
                          className="notif-sim-btn"
                          onClick={simulatePlatformNews}
                          title="Simular nova funcionalidade ou melhoria na plataforma"
                        >
                          <Svg k="sparkles" s={13} color="var(--accent)" />
                          Novidade da Plataforma
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                      <div className="notif-search-box" style={{ flex: 1, minWidth: 200 }}>
                        <Svg k="search" s={15} color="var(--muted)" />
                        <input
                          type="text"
                          placeholder="Buscar por fornecedor, assunto ou texto..."
                          value={notifSearch}
                          onChange={e => setNotifSearch(e.target.value)}
                        />
                        {notifSearch && (
                          <button
                            type="button"
                            className="link"
                            style={{ fontSize: 11, color: 'var(--muted)' }}
                            onClick={() => setNotifSearch('')}
                          >
                            Limpar
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="ghost sm"
                            onClick={() => markAllNotificationsAsRead()}
                          >
                            <Svg k="checkDouble" s={14} />
                            Marcar lidas
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            className="ghost sm danger"
                            onClick={() => clearAllNotifications()}
                            title="Limpar todas as notificações"
                          >
                            <Svg k="trash" s={14} />
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filtros em Abas */}
                  <div className="notif-filter-chips">
                    <button
                      type="button"
                      className={`notif-filter-chip ${notifScreenTab === 'all' ? 'active' : ''}`}
                      onClick={() => setNotifScreenTab('all')}
                    >
                      Todas <b>{notifications.length}</b>
                    </button>
                    <button
                      type="button"
                      className={`notif-filter-chip ${notifScreenTab === 'supplier_reply' ? 'active' : ''}`}
                      onClick={() => setNotifScreenTab('supplier_reply')}
                    >
                      <Svg k="msg" s={13} color="currentColor" />
                      Respostas de Fornecedores <b>{notifications.filter(n => n.category === 'supplier_reply').length}</b>
                    </button>
                    <button
                      type="button"
                      className={`notif-filter-chip ${notifScreenTab === 'new_supplier' ? 'active' : ''}`}
                      onClick={() => setNotifScreenTab('new_supplier')}
                    >
                      <Svg k="building" s={13} color="currentColor" />
                      Novos Fornecedores <b>{notifications.filter(n => n.category === 'new_supplier').length}</b>
                    </button>
                    <button
                      type="button"
                      className={`notif-filter-chip ${notifScreenTab === 'platform_news' ? 'active' : ''}`}
                      onClick={() => setNotifScreenTab('platform_news')}
                    >
                      <Svg k="sparkles" s={13} color="currentColor" />
                      Novidades da Plataforma <b>{notifications.filter(n => n.category === 'platform_news').length}</b>
                    </button>
                    <button
                      type="button"
                      className={`notif-filter-chip ${notifScreenTab === 'unread' ? 'active' : ''}`}
                      onClick={() => setNotifScreenTab('unread')}
                    >
                      Não lidas <b>{unreadCount}</b>
                    </button>
                  </div>

                  {/* Lista de Notificações */}
                  <div className="notif-cards-grid">
                    {(() => {
                      const query = notifSearch.toLowerCase().trim();
                      const filtered = notifications.filter(n => {
                        // Category tab filter
                        if (notifScreenTab === 'unread') {
                          if (n.read) return false;
                        } else if (notifScreenTab !== 'all') {
                          if (n.category !== notifScreenTab) return false;
                        }
                        // Search filter
                        if (query) {
                          const matchTitle = n.title.toLowerCase().includes(query);
                          const matchDesc = n.description.toLowerCase().includes(query);
                          const matchSup = n.supplierName?.toLowerCase().includes(query);
                          if (!matchTitle && !matchDesc && !matchSup) return false;
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="notif-empty" style={{ padding: '60px 20px', background: 'var(--surface)', borderRadius: 14, border: '1px dashed var(--line-2)' }}>
                            <div className="notif-empty-icon" style={{ width: 56, height: 56 }}>
                              <Svg k="bell" s={26} />
                            </div>
                            <strong style={{ fontSize: 16 }}>Nenhuma notificação encontrada</strong>
                            <p style={{ maxWidth: 300 }}>
                              {notifSearch
                                ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.'
                                : notifScreenTab === 'unread'
                                ? 'Você leu todas as notificações! Bom trabalho.'
                                : 'Você não possui notificações nesta categoria no momento.'}
                            </p>
                            {notifSearch && (
                              <button className="btn sm" type="button" onClick={() => setNotifSearch('')}>
                                Limpar busca
                              </button>
                            )}
                          </div>
                        );
                      }

                      return filtered.map(n => {
                        const iconKey = n.icon || (n.category === 'supplier_reply' ? 'msg' : n.category === 'new_supplier' ? 'building' : 'sparkles');
                        const catLabel = n.category === 'supplier_reply'
                          ? 'Resposta de Fornecedor'
                          : n.category === 'new_supplier'
                          ? 'Novo Fornecedor'
                          : 'Novidade da Plataforma';

                        return (
                          <div
                            key={n.id}
                            className={`notif-card ${!n.read ? 'unread' : ''}`}
                          >
                            <div className={`notif-icon-box ${n.category} ${n.avatar ? `media ${n.avatar}` : ''}`}>
                              <Svg k={iconKey} s={19} color="currentColor" />
                            </div>

                            <div className="notif-content">
                              <div className="notif-header-row">
                                <span className="notif-title" style={{ fontSize: 14.5 }}>{n.title}</span>
                                <span className="notif-time">{n.time}</span>
                              </div>

                              <p className="notif-desc" style={{ WebkitLineClamp: 'unset', fontSize: 13, marginTop: 4 }}>
                                {n.description}
                              </p>

                              <div className="notif-footer-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span className={`notif-cat-tag ${n.category}`}>
                                    <Svg k={iconKey} s={11} color="currentColor" />
                                    {catLabel}
                                  </span>
                                  {n.badge && (
                                    <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>
                                      {n.badge}
                                    </span>
                                  )}
                                  {n.supplierName && (
                                    <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>
                                      {n.supplierName}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                                  {n.actionLabel && (
                                    <button
                                      type="button"
                                      className="btn sm"
                                      style={{ height: 28, fontSize: 12, padding: '0 12px' }}
                                      onClick={() => handleNotificationClick(n)}
                                    >
                                      {n.actionLabel}
                                    </button>
                                  )}
                                  {!n.read && (
                                    <button
                                      type="button"
                                      className="ghost sm"
                                      style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                                      onClick={() => markNotificationAsRead(n.id)}
                                      title="Marcar como lida"
                                    >
                                      Lida
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="notif-card-del-btn"
                              aria-label="Excluir notificação"
                              title="Excluir"
                              onClick={e => {
                                e.stopPropagation();
                                removeNotification(n.id);
                              }}
                            >
                              <Svg k="trash" s={14} />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TELA: TERMOS DE USO */}
              {activeScreen === 'termos' && (
                <div className="legal-page-wrap">
                  <div className="legal-header-box">
                    <div className="legal-badge-row">
                      <span className="legal-law-badge"><Svg k="doc" s={12} /> Lei nº 8.078/1990 (CDC)</span>
                      <span className="legal-law-badge"><Svg k="shield" s={12} /> Código Civil (Arts. 610-626)</span>
                      <span className="legal-law-badge"><Svg k="check" s={12} /> Decreto nº 7.962/2013</span>
                    </div>
                    <h3 className="legal-header-title">Termos e Condições de Uso</h3>
                    <p className="legal-header-sub">
                      Direitos, garantias e normas de contratação para proprietários de obras e fornecedores credenciados na OFIR.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">1. Orçamento Prévio Obrigatório e Validade (Art. 40 do CDC)</h4>
                    <p className="legal-article-content">
                      Nos termos do Artigo 40 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor), todo fornecedor credenciado na OFIR é obrigado a entregar orçamento prévio discriminando mão de obra, materiais, condições de pagamento e datas estimadas de início e término.
                      {'\n\n'}
                      <b>Validade Legal:</b> Conforme o § 2º do Artigo 40, todo orçamento emitido na OFIR possui validade legal garantida de <b>10 (dez) dias</b> a contar do recebimento, salvo se prazo diferente constar expressamente da proposta. Uma vez aprovado pelo consumidor, o orçamento vincula e obriga os contratantes.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">2. Garantia Legal de 5 Anos de Solidez e Segurança (Art. 618 do Código Civil)</h4>
                    <p className="legal-article-content">
                      Conforme estabelece o Artigo 618 da Lei Federal nº 10.406/2002 (Código Civil Brasileiro), nos contratos de empreitada de edifícios e construções consideráveis, o empreiteiro e fornecedor de execução respondem, durante o prazo irredutível de <b>5 (cinco) anos</b>, pela solidez e segurança da obra, tanto em razão dos materiais quanto do solo.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">3. Pagamento Protegido e Custódia por Etapa</h4>
                    <p className="legal-article-content">
                      Todos os pagamentos realizados pela plataforma OFIR ficam protegidos em conta de custódia e somente são liberados ao fornecedor após a vistoria, medição e confirmação expressa da conclusão da etapa pelo dono da obra.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">4. Direito de Arrependimento em Comércio Eletrônico (Art. 49 do CDC)</h4>
                    <p className="legal-article-content">
                      Em cumprimento ao Artigo 49 do CDC e ao Decreto Federal nº 7.962/2013, o cliente tem direito de desistir da contratação em até <b>7 (sete) dias corridos</b> após o pedido, recebendo reembolso integral caso os serviços no canteiro ainda não tenham sido iniciados ou insumos personalizados não tenham sido encomendados.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn sm" type="button" onClick={() => setActiveScreen('privacidade')}>
                      Política de Privacidade (LGPD)
                    </button>
                    <button className="ghost sm" type="button" onClick={() => setActiveScreen('conformidade')}>
                      Pilares da Legislação
                    </button>
                  </div>
                </div>
              )}

              {/* TELA: POLÍTICA DE PRIVACIDADE E LGPD */}
              {activeScreen === 'privacidade' && (
                <div className="legal-page-wrap">
                  <div className="legal-header-box">
                    <div className="legal-badge-row">
                      <span className="legal-law-badge"><Svg k="shield" s={12} /> Lei Federal nº 13.709/2018</span>
                      <span className="legal-law-badge"><Svg k="globe" s={12} /> Marco Civil da Internet (Lei 12.965/14)</span>
                    </div>
                    <h3 className="legal-header-title">Privacidade e Proteção de Dados (LGPD)</h3>
                    <p className="legal-header-sub">
                      Transparência sobre como seus dados de cadastro, endereço da obra e projetos são tratados e protegidos.
                    </p>
                  </div>

                  {/* Painel dos Direitos do Titular (Art. 18 da LGPD) */}
                  <div className="legal-rights-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Svg k="check" s={16} />
                      <b style={{ color: 'var(--text)' }}>Seus Direitos como Titular de Dados (Art. 18 da LGPD)</b>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '4px 0 8px' }}>
                      Você pode solicitar acesso, portabilidade ou revogação do consentimento a qualquer momento:
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => {
                          const dataToExport = {
                            usuario: userForm,
                            obra: obra,
                            pedidosCount: orders.length,
                            enderecosCount: addresses.length,
                            dataExportacao: new Date().toISOString(),
                            baseLegal: 'LGPD Artigo 18, Inciso V (Portabilidade de Dados Pessoais)'
                          };
                          const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `dados_ofir_lgpd_${Date.now()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast('Portabilidade LGPD', 'Arquivo com seus dados pessoais exportado com sucesso.');
                        }}
                      >
                        <Svg k="doc" s={14} /> Exportar meus dados
                      </button>
                      <button
                        type="button"
                        className="ghost sm"
                        onClick={() => {
                          if (window.confirm('Deseja revogar o consentimento e redefinir suas preferências de privacidade?')) {
                            localStorage.removeItem('ofir_lgpd_consent');
                            setCookieConsent(false);
                            toast('LGPD', 'Consentimento revogado. O aviso de privacidade foi reativado.');
                          }
                        }}
                      >
                        Revogar consentimento
                      </button>
                    </div>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">Bases Legais de Tratamento (Art. 7º da LGPD)</h4>
                    <p className="legal-article-content">
                      A OFIR trata dados pessoais unicamente fundamentada em:
                      {'\n'}• <b>Execução de Contrato (Art. 7º, V):</b> Para viabilizar cotações, orçamentos, contratos de etapas de obras e intermediação com fornecedores.
                      {'\n'}• <b>Consentimento Expresso (Art. 7º, I):</b> Para envio de avisos de obras e comunicações por e-mail e WhatsApp.
                      {'\n'}• <b>Cumprimento de Obrigação Legal (Art. 7º, II):</b> Para guarda de registros de acesso conforme o Art. 15 do Marco Civil da Internet.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">Compartilhamento de Dados</h4>
                    <p className="legal-article-content">
                      Seus dados de projeto e contato são compartilhados <b>apenas e exclusivamente com os fornecedores que você selecionar</b> para cotar ou contratar. A OFIR não comercializa dados para terceiros sob nenhuma hipótese.
                    </p>
                  </div>

                  <div className="legal-dpo-box">
                    <b>Encarregado de Proteção de Dados (DPO - Art. 41 da LGPD):</b>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                      Para exercer seus direitos de confirmação, retificação ou exclusão, contate nosso DPO: <b>privacidade@ofir.com.br</b>.
                    </p>
                  </div>
                </div>
              )}

              {/* TELA: CONFORMIDADE LEGAL DA OBRA */}
              {activeScreen === 'conformidade' && (
                <div className="legal-page-wrap">
                  <div className="legal-header-box">
                    <div className="legal-badge-row">
                      <span className="legal-law-badge"><Svg k="shield" s={12} /> Ordenamento Jurídico Nacional</span>
                      <span className="legal-law-badge"><Svg k="check" s={12} /> Repositório Leis do Brasil</span>
                    </div>
                    <h3 className="legal-header-title">Conformidade com as Leis do Brasil</h3>
                    <p className="legal-header-sub">
                      Conheça os pilares normativos federais que regem a plataforma OFIR para garantir segurança, legalidade e transparência na sua obra.
                    </p>
                  </div>

                  <div className="legal-pillars-grid">
                    {LEGAL_PILLARS.map(p => (
                      <div key={p.id} className="legal-pillar-card">
                        <div className="legal-pillar-top">
                          <div className="legal-pillar-title-wrap">
                            <div className="legal-pillar-icon">
                              <Svg k={p.icon} s={16} />
                            </div>
                            <div>
                              <div className="legal-pillar-name">{p.title}</div>
                              <div className="legal-pillar-law">{p.lawRef}</div>
                            </div>
                          </div>
                        </div>
                        <p className="legal-pillar-desc">{p.description}</p>
                        <ul className="legal-pillar-list">
                          {p.obligations.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn sm" type="button" onClick={() => setActiveScreen('termos')}>
                      Termos de Uso
                    </button>
                    <button className="ghost sm" type="button" onClick={() => setActiveScreen('privacidade')}>
                      Política de Privacidade
                    </button>
                  </div>
                </div>
              )}

              {/* TELA: SOBRE A OFIR */}
              {activeScreen === 'sobre' && (
                <div className="legal-page-wrap">
                  <div className="legal-header-box">
                    <div className="legal-badge-row">
                      <span className="legal-law-badge"><Svg k="building" s={12} /> Ecossistema da Construção Civil</span>
                      <span className="legal-law-badge"><Svg k="shield" s={12} /> Pagamento Protegido</span>
                    </div>
                    <h3 className="legal-header-title">Sobre a OFIR (BuyBuild)</h3>
                    <p className="legal-header-sub">
                      A plataforma inteligente que conecta proprietários de obras aos melhores sistemas construtivos e fornecedores credenciados do Brasil.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">Nossa Missão</h4>
                    <p className="legal-article-content">
                      Tornar a jornada da construção civil transparente, previsível e segura. Eliminar os riscos de atrasos e superfaturamentos por meio de orçamentos padronizados, contratos com custódia de pagamento e acompanhamento por etapas.
                    </p>
                  </div>

                  <div className="legal-article-box">
                    <h4 className="legal-article-title">Segurança e Compliance</h4>
                    <p className="legal-article-content">
                      Operamos em estrita conformidade com as leis federais brasileiras:
                      {'\n'}• <b>Código de Defesa do Consumidor (Lei nº 8.078/90):</b> Orçamentos prévios vinculantes e validade garantida.
                      {'\n'}• <b>Código Civil (Lei nº 10.406/02):</b> Garantia legal irredutível de 5 anos de solidez e segurança.
                      {'\n'}• <b>LGPD (Lei nº 13.709/18):</b> Tratamento e proteção rigorosa de dados pessoais.
                      {'\n'}• <b>Habilitação Técnica:</b> Apenas profissionais com ART (CREA) ou RRT (CAU).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RODAPÉ DO DRAWER / SCREEN */}
            {activeScreen === 'orc' && items.length > 0 && (
              <div className="screen-foot" id="screen-foot" style={{ display: 'flex' }}>
                <button className="ghost" type="button" onClick={() => useStore.getState().toast('Orçamento salvo!')}>Salvar</button>
                <button className="ghost sq" type="button" title="Imprimir" onClick={() => window.print()}>
                  <Svg k="doc" s={16} />
                </button>
                <span className="sp"></span>
                <button className="btn" type="button" onClick={() => {
                  requireAuth(() => setActiveScreen('checkout'));
                }}>Finalizar compra</button>
              </div>
            )}

            {activeScreen?.startsWith('chat:') && (
              <form className="composer" id="composer" style={{ display: 'flex' }} onSubmit={e => {
                e.preventDefault();
                const cid = activeScreen.split(':')[1];
                if (!chatInput.trim()) return;
                sendMessage(cid, chatInput.trim());
                setChatInput('');
              }}>
                <button type="button" className="attach-btn" id="attach-btn" aria-label="Anexar arquivo" onClick={() => fileInputRef.current?.click()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" /></svg>
                </button>
                <input
                  type="file"
                  id="file-in"
                  hidden
                  ref={fileInputRef}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const cid = activeScreen.split(':')[1];
                      addFile(cid, { name: f.name, size: `${(f.size / 1024).toFixed(0)} KB` });
                    }
                  }}
                />
                <input id="composer-in" placeholder="Escreva uma mensagem" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="btn" type="submit" aria-label="Enviar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------- PERFIL COMPLETO DO FORNECEDOR ----------------- */}
      {profileSup && (() => {
        const x = profileSup;
        const d = getSupplierDetails(x);
        return (
          <div className="profile" id="profile" style={{ display: 'block' }}>
            <div className="pf-top">
              <button className="back" onClick={() => setProfileSup(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>
                Fornecedores
              </button>
              <span className="logo">
                <LogoIcon />
                OFIR
              </span>
            </div>

            <div className="pf-wrap">
              <div className="sp-head">
                <div className="pf-title">
                  <h1 className="display">{x.n}</h1>
                  <div className="pf-sub">
                    <span className="star">{STAR_ICON}<b>{rate(x.r)}</b> · {x.a} avaliações</span>
                    <span>{CHECK_BADGE}Verificado</span>
                    <span>{stageName(x.e)}{x.s !== 'all' ? ' · ' + sysName(x.s) : ''}</span>
                    <span>{x.c}</span>
                  </div>
                </div>

                <div className="pf-gwrap">
                  <div className="pf-gallery" id="pf-gallery">
                    {d.photos.map((ph, k) => (
                      <button key={k} className={`ph media ${ph.m}`} type="button">
                        <div className="inner"><Svg k={x.e} s={k === 0 ? 64 : 40} /></div>
                        {k === 0 && <span className="cap">{ph.t}</span>}
                      </button>
                    ))}
                  </div>
                  <span className="pf-count">1 / {d.photos.length}</span>
                </div>
              </div>

              <div className="pf-cols">
                <div>
                  <section className="pf-sec">
                    <div className="pf-hl">
                      <div><b>{d.obras}</b><span>obras concluídas</span></div>
                      <div><b>{d.anos} anos</b><span>de mercado</span></div>
                      <div><b>até {x.t}</b><span>para responder</span></div>
                    </div>
                  </section>

                  <section className="pf-sec pf-about">
                    <h2 className="display">Sobre</h2>
                    <p>{d.desc}</p>
                    <div className="chips">
                      {d.spec.map(c => <span key={c} className="chip">{c}</span>)}
                    </div>
                  </section>

                  <section className="pf-sec">
                    <h2 className="display">Prêmios e certificações</h2>
                    <div className="awards">
                      {d.awards.map((a, k) => (
                        <div key={k} className="award">
                          <span className="ai"><Svg k={a.ic} s={18} /></span>
                          <div><b>{a.t}</b><small>{a.s}</small></div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* SERVIÇOS */}
                  {d.svcs.length > 0 && (
                    <section className="pf-sec">
                      <h2 className="display">Serviços e preços</h2>
                      <div className="svc-table">
                        {d.svcs.map((v, k) => (
                          <div key={k} className="svc">
                            <div><b>{v.n}</b><small>{v.d}{v.days ? ` · ${v.days} dias` : ''}</small></div>
                            <div className="pr">
                              {v.quote ? (
                                <><b>Sob orçamento</b><small>cotado sobre o projeto</small></>
                              ) : (
                                <><b>{v.u === 'm²' ? `R$ ${v.p}/m²` : `R$ ${v.p?.toLocaleString('pt-BR')}`}</b><small>{v.u === 'm²' ? 'por m² construído' : 'preço fechado'}</small></>
                              )}
                            </div>
                            {v.quote ? (
                              <button className="ghost" onClick={() => { const cid = startQuote(x); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>Pedir orçamento</button>
                            ) : (
                              <div className="acts">
                                <button className="ghost" onClick={() => addItem({ kind: 'svc', sup: x.n, n: v.n, un: v.u || 'serviço', p: v.p || 0, qty: 1 })}>Orçar</button>
                                <button className="btn" onClick={() => { const cid = startQuote(x, false); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>Contratar</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* REGIÃO DE ATENDIMENTO */}
                  <section className="pf-sec">
                    <h2 className="display">Região de atendimento</h2>
                    <div className="region">
                      <div className="rh">
                        <span className="ai"><Svg k="pin" s={18} /></span>
                        <span><b>Base em {x.c}</b>Atende em um raio de {x.raio} km · {x.atende.length} cidades</span>
                      </div>
                      <div className="chips">
                        {x.atende.map(c => <span key={c} className="chip">{c}</span>)}
                      </div>
                    </div>
                  </section>

                  {/* AVALIAÇÕES */}
                  <section className="pf-sec">
                    <h2 className="display">Avaliações</h2>
                    <div className="rv-sum">
                      <div className="rv-big"><b>{rate(x.r)}</b><span>{x.a} avaliações de contratos pagos pela plataforma</span></div>
                      <div className="bars">
                        {d.bars.map(([title, val]) => (
                          <div key={title} className="bar-row">
                            {title}
                            <i><span style={{ width: `${(val / 5) * 100}%` }}></span></i>
                            <em>{rate(val)}</em>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="reviews">
                      {d.reviews.map((rv, idx) => (
                        <div key={idx} className="rv">
                          <div className="rv-who"><span className="rv-av">{initials(rv.n)}</span><div><b>{rv.n}</b><small>{rv.o}</small></div></div>
                          <div className="rv-stars" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {Array.from({ length: rv.r }).map((_, si) => (
                              <Svg key={si} k="star" s={13} color="var(--accent)" />
                            ))}
                            <span style={{ marginLeft: 6 }}>{rv.d}</span>
                          </div>
                          <p>{rv.txt}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* RESPONSÁVEL TÉCNICO */}
                  <section className="pf-sec">
                    <h2 className="display">Responsável técnico</h2>
                    <div className="resp">
                      <span className="avatar-btn">{initials(d.resp.replace(/^(Eng|Arq)\.\s/, ''))}</span>
                      <div><b>{d.resp}</b><span>{d.reg} · Na OFIR desde {d.joined}</span></div>
                    </div>
                  </section>
                </div>

                {/* CARD LATERAL FIXO DESKTOP */}
                <aside className="pf-card">
                  <div className="pf-price">
                    <b>Cotação sobre o projeto</b>
                    <span>Envie o projeto e receba a proposta por etapa com pagamento seguro</span>
                  </div>
                  <button className="btn lg block" onClick={() => { const cid = startQuote(x); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>Pedir orçamento</button>
                  <button className="ghost block" onClick={() => { const cid = startQuote(x, false); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>Enviar mensagem</button>
                  <ul className="pf-trust">
                    <li><Svg k="check" s={16} /> Pagamento em custódia, liberado por etapa</li>
                    <li><Svg k="doc" s={16} /> Contrato digital assinado na plataforma</li>
                    <li><Svg k="shield" s={16} /> Sem taxa para quem contrata</li>
                  </ul>
                </aside>
              </div>
            </div>

            {/* BARRA FIXA MOBILE DO PERFIL */}
            <div className="pf-bar">
              <div>
                <b>{x.n}</b>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Svg k="star" s={13} color="var(--accent)" /> {rate(x.r)} · {x.a} avaliações
                </span>
              </div>
              <button className="ghost sq" aria-label="Enviar mensagem" onClick={() => { const cid = startQuote(x, false); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>
                <Svg k="msg" s={18} />
              </button>
              <button className="btn" onClick={() => { const cid = startQuote(x); setProfileSup(null); setActiveScreen(`chat:${cid}`); }}>Pedir orçamento</button>
            </div>
          </div>
        );
      })()}

      {/* ----------------- SPOTLIGHT (BUSCA GLOBAL CTRL+K) ----------------- */}
      {spotOpen && (
        <div className="spot" id="spot" style={{ display: 'grid' }}>
          <div className="spot-scrim" onClick={() => setSpotOpen(false)}></div>
          <div className="spot-box">
            <div className="spot-head">
              <Svg k="search" s={18} />
              <input
                id="spot-in"
                placeholder="Fornecedor, etapa, sistema ou cidade"
                autoFocus
                value={spotQuery}
                onChange={e => setSpotQuery(e.target.value)}
              />
              <span className="kbd">Esc</span>
              <button className="spot-cancel" onClick={() => setSpotOpen(false)}>Cancelar</button>
            </div>
            <div className="spot-body" id="spot-body">
              {(() => {
                const results = SUPPLIERS.filter(s => {
                  if (!spotQuery.trim()) return true;
                  const q = spotQuery.toLowerCase();
                  return s.n.toLowerCase().includes(q) || s.c.toLowerCase().includes(q) || s.e.toLowerCase().includes(q);
                });
                if (results.length === 0) {
                  return (
                    <div className="spot-empty">
                      <b>Nenhum fornecedor encontrado</b>
                      <span>Tente buscar por outro termo, cidade ou etapa.</span>
                    </div>
                  );
                }
                return results.map(s => (
                  <div
                    key={s.n}
                    className="spot-item"
                    onClick={() => {
                      setSpotOpen(false);
                      openProfileByName(s.n);
                    }}
                  >
                    <span className={`av media ${s.m}`} style={{ width: 42, height: 42, borderRadius: 10, flex: 'none' }}></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>{s.n}</b>
                      <small>{stageName(s.e)} · {s.c}</small>
                    </div>
                    <span className="rate" style={{ flex: 'none' }}>{STAR_ICON}<b>{rate(s.r)}</b>({s.a})</span>
                  </div>
                ));
              })()}
            </div>
            <div className="spot-foot">
              <span><span className="kbd">↑</span><span className="kbd">↓</span>navegar</span>
              <span><span className="kbd">Enter</span>abrir</span>
              <span><span className="kbd">Esc</span>fechar</span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- AUTH (LOGIN & CADASTRO) ----------------- */}
      {authOpen && (
        <div className="auth" id="auth" style={{ display: 'grid' }}>
          <div className="auth-scrim" onClick={closeAuth}></div>
          <div className="auth-card">
            <div className="auth-top">
              <a className="logo" href="#">
                <LogoIcon />
                OFIR
              </a>
              <button className="icon-btn" aria-label="Fechar" onClick={closeAuth}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            {authView === 'login' && (
              <div className="auth-view">
                <h2 className="display" id="auth-title">Entrar</h2>
                <p className="auth-sub">Acompanhe sua obra, converse com fornecedores e pague com proteção.</p>
                <button className="social" type="button" onClick={() => signIn({ name: 'Eduardo Castro', email: 'eduardo@ofir.com.br', role: 'owner' })}>
                  <span className="g">G</span>Continuar com Google
                </button>
                <div className="or">ou com e-mail</div>
                <form onSubmit={e => {
                  e.preventDefault();
                  signIn({ name: 'Eduardo Castro', email: 'eduardo@ofir.com.br', role: 'owner' });
                }}>
                  <div className="inp"><label>E-mail</label><input type="email" placeholder="voce@email.com" defaultValue="eduardo@ofir.com.br" /></div>
                  <div className="inp">
                    <div className="lrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Senha</label>
                      <button type="button" className="link" onClick={() => openAuth('forgot')}>Esqueci minha senha</button>
                    </div>
                    <div className="pw">
                      <input type={showLoginPass ? 'text' : 'password'} placeholder="Sua senha" defaultValue="12345678" />
                      <button type="button" className="eye" aria-label="Mostrar senha" onClick={() => setShowLoginPass(!showLoginPass)}>
                        {showLoginPass ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button className="btn lg block" type="submit">Entrar</button>
                </form>
                <p className="auth-foot">Ainda não tem conta? <button className="link" onClick={() => openAuth('signup')}>Criar conta</button></p>
              </div>
            )}

            {authView === 'signup' && (
              <div className="auth-view">
                <h2 className="display">Criar conta</h2>
                <div className="role" id="role">
                  <button
                    type="button"
                    className={signupRole === 'owner' ? 'on' : ''}
                    onClick={() => setSignupRole('owner')}
                  >
                    <b>Vou construir</b>
                    <span>Busco fornecedores para minha obra</span>
                  </button>
                  <button
                    type="button"
                    className={signupRole === 'supplier' ? 'on' : ''}
                    onClick={() => setSignupRole('supplier')}
                  >
                    <b>Sou fornecedor</b>
                    <span>Quero receber pedidos de orçamento</span>
                  </button>
                </div>
                <div className="or">seus dados</div>
                <form onSubmit={e => {
                  e.preventDefault();
                  signIn({ name: signupName, email: signupEmail, phone: signupPhone, role: signupRole });
                  toast('Conta criada com sucesso!', `Bem-vindo à OFIR como ${signupRole === 'supplier' ? 'fornecedor parceiro' : 'proprietário da obra'}.`);
                }}>
                  <div className="inp">
                    <label>Nome completo</label>
                    <input
                      placeholder="Como devemos te chamar"
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="inp">
                    <label>E-mail</label>
                    <input
                      type="email"
                      placeholder="voce@email.com"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="inp">
                    <label>WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="(11) 90000-0000"
                      value={signupPhone}
                      onChange={e => {
                        const raw = e.target.value;
                        const digits = raw.replace(/\D/g, '').slice(0, 11);
                        let masked = digits;
                        if (digits.length > 6) {
                          masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                        } else if (digits.length > 2) {
                          masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        }
                        setSignupPhone(masked);
                      }}
                      maxLength={15}
                      required
                    />
                  </div>
                  <div className="inp">
                    <label>Senha</label>
                    <div className="pw">
                      <input
                        type={showSignupPass ? 'text' : 'password'}
                        placeholder="Mínimo de 8 caracteres"
                        value={signupPass}
                        onChange={e => setSignupPass(e.target.value)}
                        required
                      />
                      <button type="button" className="eye" aria-label="Mostrar senha" onClick={() => setShowSignupPass(!showSignupPass)}>
                        {showSignupPass ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer', margin: '14px 0 16px', lineHeight: 1.45 }}>
                    <input
                      type="checkbox"
                      checked={signupConsent}
                      onChange={e => setSignupConsent(e.target.checked)}
                      style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span>
                      Declaro que li e concordo com os{' '}
                      <button type="button" className="link" onClick={() => { closeAuth(); setActiveScreen('termos'); }}>Termos de Uso</button>
                      {' '}e com a{' '}
                      <button type="button" className="link" onClick={() => { closeAuth(); setActiveScreen('privacidade'); }}>Política de Privacidade (LGPD - Lei 13.709/2018)</button>.
                    </span>
                  </label>
                  <button className="btn lg block" type="submit" disabled={!signupConsent}>Criar conta</button>
                </form>
                <p className="auth-foot">Já tem conta? <button className="link" onClick={() => openAuth('login')}>Entrar</button></p>
              </div>
            )}

            {authView === 'forgot' && (
              <div className="auth-view">
                <h2 className="display" id="auth-title">Recuperar senha</h2>
                <p className="auth-sub">Digite seu e-mail cadastrado e enviaremos um link de redefinição imediato.</p>
                <form onSubmit={e => {
                  e.preventDefault();
                  if (!forgotEmail.trim()) return;
                  setForgotLoading(true);
                  setTimeout(() => {
                    setForgotLoading(false);
                    openAuth('sent');
                  }, 600);
                }}>
                  <div className="inp">
                    <label htmlFor="auth-forgot-email">E-mail</label>
                    <input
                      id="auth-forgot-email"
                      type="email"
                      placeholder="voce@email.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <button className="btn lg block" type="submit" disabled={forgotLoading || !forgotEmail.trim()}>
                    {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
                <p className="auth-foot">Lembrou da senha? <button type="button" className="link" onClick={() => openAuth('login')}>Voltar ao login</button></p>
              </div>
            )}

            {authView === 'sent' && (
              <div className="auth-view" style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(31,122,85,.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ok)', marginBottom: 12 }}>
                  <Svg k="check" s={28} sw={2.5} color="var(--ok)" />
                </div>
                <h2 className="display" style={{ fontSize: 22 }}>E-mail enviado!</h2>
                <p className="auth-sub" style={{ marginTop: 6, fontSize: 13.5 }}>
                  Enviamos instruções com link seguro para <b>{forgotEmail || 'seu e-mail'}</b>. Verifique sua caixa de entrada e spam.
                </p>
                <button className="btn lg block" type="button" style={{ marginTop: 16 }} onClick={() => openAuth('login')}>
                  Voltar para o login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- BANNER LGPD / PRIVACIDADE E COOKIES ----------------- */}
      {!cookieConsent && (
        <div className="lgpd-banner" role="dialog" aria-label="Aviso de Privacidade e Cookies">
          <div className="lgpd-banner-content">
            <div className="lgpd-banner-icon">
              <Svg k="shield" s={20} />
            </div>
            <div className="lgpd-banner-text">
              <b>Sua privacidade e segurança na obra:</b> Tratamos dados pessoais e registros em estrita conformidade com a <b>LGPD (Lei nº 13.709/2018)</b> e o <b>Marco Civil da Internet (Lei nº 12.965/2014)</b> para intermediar orçamentos, cotações e contratos protegidos. Conheça nossos{' '}
              <button type="button" className="link" onClick={() => setActiveScreen('termos')}>Termos de Uso</button>
              {' '}e nossa{' '}
              <button type="button" className="link" onClick={() => setActiveScreen('privacidade')}>Política de Privacidade</button>.
            </div>
          </div>
          <div className="lgpd-banner-actions">
            <button className="ghost sm" type="button" onClick={() => setActiveScreen('privacidade')}>
              Preferências
            </button>
            <button className="btn sm" type="button" onClick={acceptLgpdConsent}>
              Aceitar e continuar
            </button>
          </div>
        </div>
      )}

      {/* ----------------- TOASTS ----------------- */}
      <div className="toasts" role="region" aria-label="Notificações do sistema">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
              <b>{t.title}</b>
              {t.text && <span>{t.text}</span>}
            </div>
            <button
              type="button"
              className="x"
              onClick={() => dismissToast(t.id)}
              aria-label="Fechar notificação"
            >
              <Svg k="x" s={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
