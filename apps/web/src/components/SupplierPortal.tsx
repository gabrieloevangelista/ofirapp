import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SUPPLIERS, type Supplier, ICONS, useStore, BRLc, type Proposal } from '@ofirapp/core';
import '../supplier-portal.css';

interface SupplierPortalProps {
  onSwitchToClient: () => void;
}

interface SupplierNotif {
  id: string;
  category: 'rfq' | 'negotiation' | 'escrow' | 'sla';
  title: string;
  description: string;
  time: string;
  read: boolean;
  targetTab: 'rfqs' | 'proposta' | 'chat';
  badge: string;
  icon: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  suggestedQty: number;
  unitPrice: number;
  category: string;
  description?: string;
}

export interface ProposalItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  percent: number;
  amount: number;
  condition: string;
}

export type PaymentMethodKey = 'pix_custodia' | 'boleto_parcelado' | 'cartao_12x' | 'faturamento_28ddl';

export const PAYMENT_METHODS: { key: PaymentMethodKey; label: string; desc: string; badge: string; icon: string }[] = [
  {
    key: 'pix_custodia',
    label: 'PIX via Custódia OFIR',
    desc: 'Sem taxas financeiras para o cliente. Liberação direta por etapa aprovada na obra.',
    badge: 'Recomendado',
    icon: 'shield'
  },
  {
    key: 'boleto_parcelado',
    label: 'Boleto Bancário Estruturado (Escrow)',
    desc: 'Emissão de boletos faturados com split protegido conforme cada marco físico.',
    badge: 'Corporativo',
    icon: 'doc'
  },
  {
    key: 'cartao_12x',
    label: 'Cartão de Crédito em até 12x',
    desc: 'Parcelamento flexível para o cliente e recebimento integral garantido para sua empresa.',
    badge: 'Até 12x',
    icon: 'orc'
  },
  {
    key: 'faturamento_28ddl',
    label: 'Faturamento Direto B2B (28 DDL)',
    desc: 'Faturamento com confissão de dívida e garantia de recebíveis pela plataforma.',
    badge: 'B2B Direto',
    icon: 'building'
  }
];

const INITIAL_CATALOG_ITEMS: Record<string, CatalogItem[]> = {
  'Base Forte Fundações': [
    {
      id: 'cat_bf_1',
      name: 'Fundação em Radier Armado fck 30 MPa',
      unit: 'm²',
      suggestedQty: 420,
      unitPrice: 260.00,
      category: 'fundacao',
      description: 'Execução completa com escavação, forma, armação CA-50 e concreto usinado bombeado com cura química.'
    },
    {
      id: 'cat_bf_2',
      name: 'Estaca Escavada Mecanizada Ø 30cm',
      unit: 'm',
      suggestedQty: 180,
      unitPrice: 95.00,
      category: 'fundacao',
      description: 'Perfuração com trado mecânico rotativo, colocação de armadura em gaiola e concretagem contínua.'
    },
    {
      id: 'cat_bf_3',
      name: 'Bloco de Coroamento e Viga Baldrame',
      unit: 'm³',
      suggestedQty: 24,
      unitPrice: 1450.00,
      category: 'fundacao',
      description: 'Montagem de formas resinadas, armação estrutural de aço e lançamento de concreto usinado.'
    },
    {
      id: 'cat_bf_4',
      name: 'Escavação Mecanizada de Vala e Bota-Fora',
      unit: 'm³',
      suggestedQty: 150,
      unitPrice: 78.00,
      category: 'terreno',
      description: 'Escavação de solo até cota de projeto com transporte e descarte em aterro licenciado.'
    },
    {
      id: 'cat_bf_5',
      name: 'Sondagem de Solo SPT a Percussão',
      unit: 'vb',
      suggestedQty: 1,
      unitPrice: 4200.00,
      category: 'terreno',
      description: '3 furos de sondagem a percussão com relatório estratigráfico, N-SPT e ART do engenheiro geotécnico.'
    }
  ]
};

const INITIAL_PROPOSAL_ITEMS: ProposalItem[] = [
  { id: 'pi_1', name: 'Escavação mecânica e regularização do subleito', unit: 'm²', qty: 420, unitPrice: 45.00, total: 18900 },
  { id: 'pi_2', name: 'Armadura de aço CA-50 malha dupla e estribos', unit: 'kg', qty: 3200, unitPrice: 12.50, total: 40000 },
  { id: 'pi_3', name: 'Concreto usinado fck 30 MPa bombeado', unit: 'm³', qty: 110, unitPrice: 580.00, total: 63800 },
  { id: 'pi_4', name: 'Mão de obra especializada e nivelamento a laser', unit: 'vb', qty: 1, unitPrice: 63300.00, total: 63300 }
];

const INITIAL_MILESTONES: PaymentMilestone[] = [
  { id: 'm1', name: 'Etapa 1 · Sondagem e Escavação Mecânica', percent: 30, amount: 55800, condition: 'Após vistoria do subleito e locação topográfica' },
  { id: 'm2', name: 'Etapa 2 · Armação de Aço e Concretagem Usinada', percent: 50, amount: 93000, condition: 'Após lançamento e adensamento do concreto usinado' },
  { id: 'm3', name: 'Etapa 3 · Cura, Desforma e Liberação de Carga', percent: 20, amount: 37200, condition: 'Após teste de rompimento de corpos de prova (28 dias)' }
];

const INITIAL_SUPPLIER_NOTIFS: SupplierNotif[] = [
  {
    id: 'sn1',
    category: 'negotiation',
    title: 'Negociação solicitada por Eduardo Castro',
    description: 'O cliente respondeu à sua proposta: "Gostaria de negociar os valores e prazos desta proposta."',
    time: 'Há 12 min',
    read: false,
    targetTab: 'chat',
    badge: 'Negociação',
    icon: 'msg'
  },
  {
    id: 'sn2',
    category: 'rfq',
    title: 'Nova cotação: Obra Residencial Atibaia',
    description: 'Eduardo Castro enviou planta e sondagem de solo para fundação de 420m².',
    time: 'Há 2h',
    read: false,
    targetTab: 'rfqs',
    badge: 'Nova RFQ',
    icon: 'doc'
  },
  {
    id: 'sn3',
    category: 'escrow',
    title: 'R$ 186.000 em custódia protegida',
    description: 'Pagamento depositado na OFIR aguardando conclusão física das etapas.',
    time: 'Hoje, 09:30',
    read: false,
    targetTab: 'proposta',
    badge: 'Custódia OFIR',
    icon: 'shield'
  },
  {
    id: 'sn4',
    category: 'sla',
    title: 'Alerta de SLA: 36 horas restantes',
    description: 'Responda dentro da janela de 72h para manter seu selo de fornecedor verificado.',
    time: 'Ontem',
    read: true,
    targetTab: 'rfqs',
    badge: 'SLA 72h',
    icon: 'clock'
  }
];

const Svg = ({ k, s = 18, color, sw = 2 }: { k: string; s?: number; color?: string; sw?: number }) => {
  const d = ICONS[k];
  if (!d) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};

const CHECK_BADGE = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Verificado" style={{ marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M3 21h18M6 21V10l6-6 6 6v11M9 15l2 2 4-4" />
  </svg>
);

export function SupplierPortal({ onSwitchToClient }: SupplierPortalProps) {
  const {
    conversations,
    proposals,
    toast,
    theme,
    toggleTheme
  } = useStore();

  // Fornecedor ativo no painel
  const [selectedSupName, setSelectedSupName] = useState<string>('Base Forte Fundações');
  const [activeTab, setActiveTab] = useState<'geral' | 'rfqs' | 'proposta' | 'chat' | 'catalogo'>('geral');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Sub-aba dentro da aba de propostas ('editor' ou 'history')
  const [propSubTab, setPropSubTab] = useState<'editor' | 'history'>('editor');

  // Notificações da Área do Fornecedor
  const notifBellRef = useRef<HTMLDivElement>(null);
  const [notifs, setNotifs] = useState<SupplierNotif[]>(INITIAL_SUPPLIER_NOTIFS);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'rfq' | 'negotiation' | 'escrow'>('all');

  // Menu Dropdown da Empresa Fornecedora (B2B .umenu)
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [supplierMenuOpen, setSupplierMenuOpen] = useState(false);

  const unreadCount = notifs.filter(n => !n.read).length;

  // Modais de Funções do Fornecedor acionados pelo menu
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [radiusModalOpen, setRadiusModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

  // Estados de Raio de Atuação
  const [coverageRadius, setCoverageRadius] = useState<number>(110);
  const [coverageCities, setCoverageCities] = useState<string[]>([
    'Campinas', 'Valinhos', 'Vinhedo', 'Indaiatuba', 'Jundiaí', 'Atibaia', 'Bragança Paulista'
  ]);
  const [newCityInput, setNewCityInput] = useState<string>('');
  const [freightPolicy, setFreightPolicy] = useState<string>('included');

  // Estados de Disponibilidade
  const [pauseReason, setPauseReason] = useState<string>('capacity');
  const [maxConcurrentProjects, setMaxConcurrentProjects] = useState<number>(4);
  const [responseSlaHours, setResponseSlaHours] = useState<number>(24);

  // Estado de Saldo de Custódia
  const [releasedBalance, setReleasedBalance] = useState<number>(58200);
  const [inEscrowBalance, setInEscrowBalance] = useState<number>(127800);

  const handleAddCoverageCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityInput.trim()) return;
    const formatted = newCityInput.trim();
    if (coverageCities.includes(formatted)) {
      toast('Cidade já cadastrada na sua lista.');
      return;
    }
    setCoverageCities(prev => [...prev, formatted]);
    setNewCityInput('');
    toast('Cidade adicionada à área de atuação', formatted);
  };

  const handleRemoveCoverageCity = (cityToRemove: string) => {
    if (coverageCities.length <= 1) {
      toast('Mantenha ao menos uma cidade na sua área de atendimento.');
      return;
    }
    setCoverageCities(prev => prev.filter(c => c !== cityToRemove));
    toast('Cidade removida da área de atuação');
  };

  const handleSaveCoverageSettings = () => {
    setRadiusModalOpen(false);
    toast('Configurações de atuação salvas!', `Raio de ${coverageRadius} km com ${coverageCities.length} cidades atendidas.`);
  };

  const handleSaveAvailabilitySettings = () => {
    setAvailabilityModalOpen(false);
    toast(
      isOnline ? 'Status atualizado: Recebendo cotações' : 'Status atualizado: Recepção de cotações pausada',
      isOnline ? 'Sua empresa está ativa no buscador de obras da região.' : 'Nenhuma nova cotação será enviada até a reativação.'
    );
  };

  const handleRequestEscrowPayout = () => {
    if (releasedBalance <= 0) {
      toast('Nenhum saldo liberado disponível para transferência no momento.');
      return;
    }
    const amount = releasedBalance;
    setReleasedBalance(0);
    setEscrowModalOpen(false);
    toast('Transferência solicitada com sucesso!', `${BRLc(amount)} enviado para sua conta bancária via PIX (Liquidação em D+0).`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifBellRef.current && !notifBellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setSupplierMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllNotifsRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    toast('Todas as notificações foram marcadas como lidas.');
  };

  const handleNotifClick = (n: SupplierNotif) => {
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    setNotifOpen(false);
    setActiveTab(n.targetTab);
  };

  const currentSup = useMemo(() => {
    return SUPPLIERS.find(s => s.n === selectedSupName) || SUPPLIERS[0];
  }, [selectedSupName]);

  const supConvs = useMemo(() => {
    return conversations.filter(c => c.n === currentSup.n);
  }, [conversations, currentSup]);

  const [activeChatId, setActiveChatId] = useState<string>(supConvs[0]?.id || 'c1');
  const [replyInput, setReplyInput] = useState<string>('');

  // ==================== ESTADO DO CATÁLOGO DE PREÇOS ====================
  const [catalogs, setCatalogs] = useState<Record<string, CatalogItem[]>>(() => {
    const initial = { ...INITIAL_CATALOG_ITEMS };
    // Gera itens coerentes para outros fornecedores caso não existam
    SUPPLIERS.forEach(s => {
      if (!initial[s.n]) {
        if (s.prods && s.prods.length > 0) {
          initial[s.n] = s.prods.map((p, idx) => ({
            id: `cat_${s.i}_${idx}`,
            name: p.n,
            unit: p.un,
            suggestedQty: p.def,
            unitPrice: p.p,
            category: s.e,
            description: `Fornecimento e aplicação padrão para obras de ${s.e}.`
          }));
        } else {
          initial[s.n] = [
            {
              id: `cat_gen_${s.i}_1`,
              name: `Serviço Especializado de ${s.e}`,
              unit: 'vb',
              suggestedQty: 1,
              unitPrice: 15000.00,
              category: s.e,
              description: 'Mão de obra técnica qualificada com emissão de ART e seguro de responsabilidade civil.'
            }
          ];
        }
      }
    });
    return initial;
  });

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null);

  // Form de catálogo
  const [catFormName, setCatFormName] = useState('');
  const [catFormUnit, setCatFormUnit] = useState('m²');
  const [catFormQty, setCatFormQty] = useState(100);
  const [catFormPrice, setCatFormPrice] = useState(150);
  const [catFormDesc, setCatFormDesc] = useState('');

  const currentCatalogList = useMemo(() => {
    const list = catalogs[selectedSupName] || [];
    if (!catalogSearch.trim()) return list;
    const q = catalogSearch.toLowerCase();
    return list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.unit.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  }, [catalogs, selectedSupName, catalogSearch]);

  const openAddCatalogModal = () => {
    setEditingCatalogItem(null);
    setCatFormName('');
    setCatFormUnit('m²');
    setCatFormQty(100);
    setCatFormPrice(150);
    setCatFormDesc('');
    setCatalogModalOpen(true);
  };

  const openEditCatalogModal = (item: CatalogItem) => {
    setEditingCatalogItem(item);
    setCatFormName(item.name);
    setCatFormUnit(item.unit);
    setCatFormQty(item.suggestedQty);
    setCatFormPrice(item.unitPrice);
    setCatFormDesc(item.description || '');
    setCatalogModalOpen(true);
  };

  const handleSaveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      toast('Informe o nome do item / serviço.');
      return;
    }

    const newItem: CatalogItem = {
      id: editingCatalogItem ? editingCatalogItem.id : `cat_custom_${Date.now()}`,
      name: catFormName.trim(),
      unit: catFormUnit,
      suggestedQty: Number(catFormQty) || 1,
      unitPrice: Number(catFormPrice) || 0,
      category: currentSup.e,
      description: catFormDesc.trim()
    };

    setCatalogs(prev => {
      const currentList = prev[selectedSupName] || [];
      if (editingCatalogItem) {
        return {
          ...prev,
          [selectedSupName]: currentList.map(it => it.id === editingCatalogItem.id ? newItem : it)
        };
      }
      return {
        ...prev,
        [selectedSupName]: [newItem, ...currentList]
      };
    });

    setCatalogModalOpen(false);
    toast(editingCatalogItem ? 'Item atualizado com sucesso' : 'Item adicionado ao catálogo');
  };

  const handleDeleteCatalogItem = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o item "${name}" do seu catálogo?`)) {
      setCatalogs(prev => ({
        ...prev,
        [selectedSupName]: (prev[selectedSupName] || []).filter(it => it.id !== id)
      }));
      toast('Item removido do catálogo');
    }
  };

  const handleUseCatalogItemInProposal = (item: CatalogItem) => {
    const newPropItem: ProposalItem = {
      id: `pi_${Date.now()}`,
      name: item.name,
      unit: item.unit,
      qty: item.suggestedQty,
      unitPrice: item.unitPrice,
      total: item.suggestedQty * item.unitPrice
    };

    setPropItems(prev => [...prev, newPropItem]);
    setActiveTab('proposta');
    setPropSubTab('editor');
    toast('Item incluído na proposta', `${item.name} (${item.suggestedQty} ${item.unit})`);
  };

  // ==================== ESTADO DA PROPOSTA COMERCIAL ====================
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propTitle, setPropTitle] = useState('Fundação em Radier 420m²');
  const [propMeta, setPropMeta] = useState('420 m² · Armação e concretagem usinada inclusos · Obra Casa Térrea');
  const [deliveryDays, setDeliveryDays] = useState<number>(26);
  const [deliveryStartDays, setDeliveryStartDays] = useState<number>(3);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodKey>('pix_custodia');

  // Itens detalhados com Quantidade e Valor separados
  const [propItems, setPropItems] = useState<ProposalItem[]>(INITIAL_PROPOSAL_ITEMS);

  // Divisão de como será o pagamento (Marcos físicos de Custódia)
  const [milestones, setMilestones] = useState<PaymentMilestone[]>(INITIAL_MILESTONES);

  // Modal de prévia da proposta
  const [previewProp, setPreviewProp] = useState<Proposal | null>(null);

  // Subtotal calculado diretamente a partir dos itens
  const propTotal = useMemo(() => {
    return propItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  }, [propItems]);

  const platformFee = Math.round(propTotal * 0.03); // 3% taxa de custódia da OFIR
  const netSupplierValue = propTotal - platformFee;

  // Atualiza os valores das etapas automaticamente quando o total dos itens mudar
  useEffect(() => {
    if (propTotal <= 0) return;
    setMilestones(prev => prev.map(m => ({
      ...m,
      amount: Math.round((propTotal * m.percent) / 100)
    })));
  }, [propTotal]);

  const handleUpdateItemField = (idx: number, field: keyof ProposalItem, val: any) => {
    setPropItems(prev => {
      const next = [...prev];
      const target = { ...next[idx] };
      if (field === 'qty') {
        const qty = Number(val) || 0;
        target.qty = qty;
        target.total = qty * target.unitPrice;
      } else if (field === 'unitPrice') {
        const p = Number(val) || 0;
        target.unitPrice = p;
        target.total = target.qty * p;
      } else if (field === 'name') {
        target.name = String(val);
      } else if (field === 'unit') {
        target.unit = String(val);
      }
      next[idx] = target;
      return next;
    });
  };

  const handleAddPropItem = () => {
    setPropItems(prev => [
      ...prev,
      {
        id: `pi_${Date.now()}`,
        name: 'Novo serviço / insumo de engenharia',
        unit: 'm²',
        qty: 10,
        unitPrice: 100,
        total: 1000
      }
    ]);
  };

  const handleRemovePropItem = (idx: number) => {
    if (propItems.length <= 1) {
      toast('A proposta precisa ter ao menos um item.');
      return;
    }
    setPropItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddMilestone = () => {
    setMilestones(prev => {
      const remainingPercent = Math.max(10, 100 - prev.reduce((a, b) => a + b.percent, 0));
      return [
        ...prev,
        {
          id: `m_${Date.now()}`,
          name: `Etapa ${prev.length + 1} · Nova fase de liberação`,
          percent: remainingPercent,
          amount: Math.round((propTotal * remainingPercent) / 100),
          condition: 'Após vistoria técnica e aprovação pelo cliente'
        }
      ];
    });
  };

  const handleUpdateMilestone = (idx: number, name: string, percent: number, condition: string) => {
    setMilestones(prev => {
      const next = [...prev];
      const validPercent = Math.min(100, Math.max(1, percent));
      next[idx] = {
        ...next[idx],
        name,
        percent: validPercent,
        amount: Math.round((propTotal * validPercent) / 100),
        condition
      };
      return next;
    });
  };

  const handleRemoveMilestone = (idx: number) => {
    if (milestones.length <= 1) {
      toast('A divisão de pagamento precisa ter ao menos uma etapa.');
      return;
    }
    setMilestones(prev => prev.filter((_, i) => i !== idx));
  };

  // Enviar ou Salvar Proposta (Edição ou Nova)
  const handleSaveOrSendProposal = () => {
    const targetConvId = activeChatId || supConvs[0]?.id;
    if (!targetConvId) {
      toast('Selecione uma conversa com cliente para enviar a proposta.');
      return;
    }

    if (propItems.length === 0 || propTotal <= 0) {
      toast('Adicione ao menos um item com valor válido à proposta.');
      return;
    }

    const rowsData: [string, number][] = milestones.map(m => [m.name, m.amount]);
    const methodObj = PAYMENT_METHODS.find(p => p.key === paymentMethod);
    const enrichedMeta = `${propMeta} · Prazo: ${deliveryDays} dias úteis · Pagamento: ${methodObj?.label}`;

    const propId = editingPropId || `p_sup_${Date.now()}`;
    const newProposalObj: Proposal = {
      id: propId,
      title: propTitle,
      meta: enrichedMeta,
      rows: rowsData,
      status: 'open',
      conv: targetConvId,
      deliveryDays,
      paymentMethod,
      itemsDetail: propItems.map(it => ({
        id: it.id,
        desc: it.name,
        unit: it.unit,
        qty: it.qty,
        unitPrice: it.unitPrice,
        total: it.total
      })),
      paymentStages: milestones.map(m => ({
        id: m.id,
        name: m.name,
        percent: m.percent,
        amount: m.amount,
        trigger: m.condition
      })),
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    useStore.setState(state => {
      const updatedProposals = {
        ...state.proposals,
        [propId]: newProposalObj
      };

      const updatedConversations = state.conversations.map(c => {
        if (c.id === targetConvId) {
          const alreadyHasPropMsg = c.msgs.some(m => m.t === 'prop' && m.id === propId);
          if (alreadyHasPropMsg) {
            return {
              ...c,
              msgs: [
                ...c.msgs,
                { t: 'them' as const, x: `Proposta comercial atualizada com novo cronograma de ${deliveryDays} dias úteis e condições de pagamento:`, h: 'Agora' },
                { t: 'prop' as const, id: propId }
              ]
            };
          }
          return {
            ...c,
            msgs: [
              ...c.msgs,
              { t: 'them' as const, x: `Olá! Montei a proposta comercial detalhada com prazo de ${deliveryDays} dias úteis e divisão em ${milestones.length} etapas:`, h: 'Agora' },
              { t: 'prop' as const, id: propId }
            ]
          };
        }
        return c;
      });

      return {
        proposals: updatedProposals,
        conversations: updatedConversations
      };
    });

    toast(
      editingPropId ? 'Proposta atualizada!' : 'Proposta enviada ao cliente!',
      'O cliente pode analisar as quantidades, valores e formas de pagamento diretamente no app.'
    );

    setEditingPropId(null);
    setActiveTab('chat');
  };

  // Apagar proposta
  const handleDeleteProposal = (propId: string) => {
    if (confirm('Deseja realmente apagar esta proposta? Ela deixará de estar visível para o cliente.')) {
      useStore.setState(state => {
        const nextProps = { ...state.proposals };
        delete nextProps[propId];
        const nextConvs = state.conversations.map(c => ({
          ...c,
          msgs: c.msgs.filter(m => !(m.t === 'prop' && m.id === propId))
        }));
        return {
          proposals: nextProps,
          conversations: nextConvs
        };
      });

      if (editingPropId === propId) {
        setEditingPropId(null);
      }
      toast('Proposta apagada com sucesso');
    }
  };

  // Carregar proposta existente para edição
  const handleEditProposal = (prop: Proposal) => {
    setEditingPropId(prop.id);
    setPropTitle(prop.title);
    setPropMeta(prop.meta.split('·')[0]?.trim() || prop.meta);
    if (prop.deliveryDays) setDeliveryDays(prop.deliveryDays);
    if (prop.paymentMethod && PAYMENT_METHODS.some(pm => pm.key === prop.paymentMethod)) {
      setPaymentMethod(prop.paymentMethod as PaymentMethodKey);
    }

    if (prop.itemsDetail && prop.itemsDetail.length > 0) {
      setPropItems(prop.itemsDetail.map(it => ({
        id: it.id || `pi_${Date.now()}`,
        name: it.desc,
        unit: it.unit,
        qty: it.qty,
        unitPrice: it.unitPrice,
        total: it.total
      })));
    } else {
      // Reconstrói a partir de rows se não tiver itemsDetail
      setPropItems(prop.rows.map((r, idx) => ({
        id: `pi_rec_${idx}`,
        name: r[0],
        unit: 'vb',
        qty: 1,
        unitPrice: r[1],
        total: r[1]
      })));
    }

    if (prop.paymentStages && prop.paymentStages.length > 0) {
      setMilestones(prop.paymentStages.map(s => ({
        id: s.id || `m_${Date.now()}`,
        name: s.name,
        percent: s.percent,
        amount: s.amount,
        condition: s.trigger || 'Conforme vistoria física'
      })));
    } else {
      const tot = prop.rows.reduce((a, b) => a + b[1], 0) || 1;
      setMilestones(prop.rows.map((r, idx) => ({
        id: `m_rec_${idx}`,
        name: r[0],
        percent: Math.round((r[1] / tot) * 100),
        amount: r[1],
        condition: 'Liberação por conclusão da etapa'
      })));
    }

    setPropSubTab('editor');
    setActiveTab('proposta');
    toast('Proposta carregada para edição', 'Altere os valores, prazos ou quantidades e clique em salvar.');
  };

  // Histórico de todas as propostas da empresa
  const supplierProposalHistory = useMemo(() => {
    return Object.values(proposals).filter(p => {
      const conv = conversations.find(c => c.id === p.conv);
      return !conv || conv.n === currentSup.n;
    });
  }, [proposals, conversations, currentSup]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeChatId) return;

    useStore.setState(state => ({
      conversations: state.conversations.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            msgs: [
              ...c.msgs,
              { t: 'them', x: replyInput.trim(), h: 'Agora' }
            ]
          };
        }
        return c;
      })
    }));

    setReplyInput('');
    toast('Mensagem enviada');
  };

  const activeConv = conversations.find(c => c.id === activeChatId) || supConvs[0];

  return (
    <div className="supplier-portal-theme">
      {/* ----------------- NAVBAR CANÔNICA DA OFIR (B2B) ----------------- */}
      <header className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a className="logo" href="#" onClick={e => { e.preventDefault(); setActiveTab('geral'); }}>
            <LogoIcon />
            OFIR
          </a>
          <span className="b2b-indicator-pill">
            <Svg k="shield" s={13} color="var(--accent)" />
            Fornecedor Credenciado
          </span>
        </div>

        {/* Abas com a mesma geometria e estados da tela do cliente */}
        <nav className="tabs" id="tabs">
          <a
            href="#"
            className={activeTab === 'geral' ? 'active' : ''}
            onClick={e => { e.preventDefault(); setActiveTab('geral'); }}
          >
            Painel da Empresa
          </a>
          <a
            href="#"
            className={activeTab === 'rfqs' ? 'active' : ''}
            onClick={e => { e.preventDefault(); setActiveTab('rfqs'); }}
          >
            Oportunidades & RFQs <span className="tag" style={{ background: 'var(--accent)', color: '#fff' }}>2 novas</span>
          </a>
          <a
            href="#"
            className={activeTab === 'proposta' ? 'active' : ''}
            onClick={e => { e.preventDefault(); setActiveTab('proposta'); }}
          >
            Emissor de Proposta
          </a>
          <a
            href="#"
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={e => { e.preventDefault(); setActiveTab('chat'); }}
          >
            Negociações & Mensagens {supConvs.length > 0 && <span className="tag">{supConvs.length}</span>}
          </a>
          <a
            href="#"
            className={activeTab === 'catalogo' ? 'active' : ''}
            onClick={e => { e.preventDefault(); setActiveTab('catalogo'); }}
          >
            Tabela de Preços ({currentCatalogList.length})
          </a>
        </nav>

        {/* Ações da Topbar */}
        <div className="actions">
          {/* Seletor de Empresa Cadastrada */}
          <div className="sup-select-chip" title="Alternar visão de fornecedor cadastrado na OFIR">
            <Svg k="building" s={15} color="var(--accent)" />
            <select
              value={selectedSupName}
              onChange={e => {
                setSelectedSupName(e.target.value);
                const conv = conversations.find(c => c.n === e.target.value);
                if (conv) setActiveChatId(conv.id);
              }}
            >
              {SUPPLIERS.map(s => (
                <option key={s.n} value={s.n}>
                  {s.n} ({s.e})
                </option>
              ))}
            </select>
          </div>

          {/* Botão de retorno imediato à visão do cliente */}
          <button
            type="button"
            className="ghost sm"
            onClick={onSwitchToClient}
            title="Voltar para a visão do dono da obra"
            style={{ fontWeight: 600, fontSize: 12.5 }}
          >
            <Svg k="back" s={14} />
            Visão do Cliente
          </button>

          {/* BOTÃO E POPOVER DE NOTIFICAÇÕES DO FORNECEDOR */}
          <div className="notif-bell-wrap" ref={notifBellRef}>
            <button
              className={`ghost sq notif-btn ${unreadCount > 0 ? 'has-unread' : ''} ${notifOpen ? 'open' : ''}`}
              aria-label={`Notificações (${unreadCount} não lidas)`}
              title="Notificações do Fornecedor"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Svg k="bell" s={17} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-popover" role="dialog" aria-label="Notificações do Fornecedor">
                <div className="notif-popover-head">
                  <div className="notif-popover-title-row">
                    <h4>Notificações da Empresa</h4>
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
                      onClick={markAllNotifsRead}
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                {/* Filtros em Pílulas */}
                <div className="notif-popover-tabs">
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifTab === 'all' ? 'active' : ''}`}
                    onClick={() => setNotifTab('all')}
                  >
                    Todas ({notifs.length})
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifTab === 'negotiation' ? 'active' : ''}`}
                    onClick={() => setNotifTab('negotiation')}
                  >
                    Negociações
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifTab === 'rfq' ? 'active' : ''}`}
                    onClick={() => setNotifTab('rfq')}
                  >
                    Cotações
                  </button>
                  <button
                    type="button"
                    className={`notif-tab-pill ${notifTab === 'escrow' ? 'active' : ''}`}
                    onClick={() => setNotifTab('escrow')}
                  >
                    Custódia
                  </button>
                </div>

                {/* Lista de Notificações com Ícones Padronizados */}
                <div className="notif-popover-list">
                  {notifs
                    .filter(n => notifTab === 'all' || n.category === notifTab)
                    .map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(n)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="notif-item-ico">
                          <Svg k={n.icon} s={16} color="var(--accent)" />
                        </div>
                        <div className="notif-item-content">
                          <div className="notif-item-meta">
                            <span className="notif-item-badge">{n.badge}</span>
                            <span className="notif-item-time">{n.time}</span>
                          </div>
                          <h5>{n.title}</h5>
                          <p>{n.description}</p>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="notif-popover-foot">
                  <button
                    type="button"
                    className="notif-clear-all-btn"
                    onClick={() => {
                      setNotifOpen(false);
                      setActiveTab('rfqs');
                    }}
                  >
                    Ver todas as cotações pendentes
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="ghost sq"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            title="Alternar tema claro/escuro"
          >
            <Svg k={theme === 'dark' ? 'sun' : 'moon'} s={16} />
          </button>

          {/* MENU DROPDOWN DA EMPRESA FORNECEDORA (PADRÃO .UMENU OFIR B2B) */}
          <div className="user" style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setSupplierMenuOpen(!supplierMenuOpen)}
              title={`Menu da empresa: ${selectedSupName}`}
              aria-label="Menu da empresa"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                boxShadow: supplierMenuOpen ? '0 0 0 2px var(--accent)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {selectedSupName.slice(0, 2).toUpperCase()}
            </button>

            {supplierMenuOpen && (
              <div
                className="umenu supplier-umenu"
                role="menu"
                style={{
                  display: 'block',
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: 290,
                  zIndex: 1000
                }}
              >
                {/* Cabeçalho da Empresa Fornecedora */}
                <div className="who" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b style={{ fontSize: 14, color: 'var(--text)' }}>{currentSup.n}</b>
                    <Svg k="shield" s={14} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                    contato@{currentSup.n.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br
                  </span>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="pill ok" style={{ fontSize: 10, padding: '1px 6px' }}>Fornecedor Verificado</span>
                    <span className="pill" style={{ fontSize: 10, padding: '1px 6px' }}>SLA 98.4%</span>
                  </div>
                </div>

                {/* Alternar de volta para o cliente */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    onSwitchToClient();
                  }}
                  style={{ color: 'var(--accent)', fontWeight: 700, background: 'var(--portal-badge-bg)' }}
                >
                  <Svg k="user" s={16} color="var(--accent)" />
                  <span>Visão do Cliente (Obra)</span>
                  <span className="umenu-badge" style={{ background: 'var(--accent)', color: '#fff' }}>Trocar</span>
                </button>

                <hr />

                {/* Funções do Fornecedor */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setActiveTab('geral');
                  }}
                >
                  <Svg k="building" s={16} />
                  <span>Painel da Empresa & SLA</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setActiveTab('rfqs');
                  }}
                >
                  <Svg k="doc" s={16} />
                  <span>Oportunidades & RFQs</span>
                  <span className="umenu-badge" style={{ background: 'var(--accent)', color: '#fff' }}>2 novas</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setPropSubTab('editor');
                    setActiveTab('proposta');
                  }}
                >
                  <Svg k="clip" s={16} />
                  <span>Emissor de Propostas</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setPropSubTab('history');
                    setActiveTab('proposta');
                  }}
                >
                  <Svg k="clock" s={16} />
                  <span>Histórico de Propostas</span>
                  <span className="cnt">{supplierProposalHistory.length}</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setActiveTab('chat');
                  }}
                >
                  <Svg k="msg" s={16} />
                  <span>Negociações & Mensagens</span>
                  {supConvs.length > 0 && <span className="umenu-badge">{supConvs.length}</span>}
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setActiveTab('catalogo');
                  }}
                >
                  <Svg k="orc" s={16} />
                  <span>Tabela de Preços & Insumos</span>
                  <span className="cnt">{currentCatalogList.length}</span>
                </button>

                <hr />

                {/* Ferramentas e Garantias B2B */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setEscrowModalOpen(true);
                  }}
                >
                  <Svg k="shield" s={16} />
                  <span>Conta Escrow & Recebíveis</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--ok)' }}>R$ 186k</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setRadiusModalOpen(true);
                  }}
                >
                  <Svg k="pin" s={16} />
                  <span>Raio de Atuação ({coverageRadius} km)</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    setAvailabilityModalOpen(true);
                  }}
                >
                  <Svg k="settings" s={16} />
                  <span>Disponibilidade ({isOnline ? 'Ativo' : 'Pausado'})</span>
                </button>

                <hr />

                {/* Sair do Portal B2B */}
                <button
                  role="menuitem"
                  className="danger"
                  onClick={() => {
                    setSupplierMenuOpen(false);
                    onSwitchToClient();
                    toast('Sessão encerrada no portal de fornecedores.');
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <Svg k="x" s={14} color="#ef4444" />
                  <span>Sair do Portal B2B</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- SUBNAV RESPONSIVA (TABLETS E MOBILE) ----------------- */}
      <nav className="supplier-subnav-bar" aria-label="Navegação do Fornecedor">
        <button
          type="button"
          className={`subnav-pill ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          <Svg k="building" s={14} /> Painel da Empresa
        </button>
        <button
          type="button"
          className={`subnav-pill ${activeTab === 'rfqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('rfqs')}
        >
          <Svg k="doc" s={14} /> Oportunidades & RFQs
          <span className="tag" style={{ background: 'var(--accent)', color: '#fff' }}>2</span>
        </button>
        <button
          type="button"
          className={`subnav-pill ${activeTab === 'proposta' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposta')}
        >
          <Svg k="clip" s={14} /> Emissor de Proposta
        </button>
        <button
          type="button"
          className={`subnav-pill ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <Svg k="msg" s={14} /> Mensagens
          {supConvs.length > 0 && <span className="tag">{supConvs.length}</span>}
        </button>
        <button
          type="button"
          className={`subnav-pill ${activeTab === 'catalogo' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          <Svg k="orc" s={14} /> Preços ({currentCatalogList.length})
        </button>
      </nav>

      {/* ----------------- SUB-HEADER B2B DE STATUS ----------------- */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', padding: '10px var(--g)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--ok)' : 'var(--muted)', display: 'inline-block' }}></span>
            <strong style={{ color: 'var(--text)' }}>{currentSup.n}</strong>
            {CHECK_BADGE}
            <span style={{ color: 'var(--muted)' }}>
              · Atendendo {coverageCities.slice(0, 3).join(', ')}{coverageCities.length > 3 ? ` e mais ${coverageCities.length - 3}` : ''} e raio de {coverageRadius} km
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <span style={{ color: 'var(--muted)' }}>Disponibilidade na região:</span>
            <b style={{ color: isOnline ? 'var(--ok)' : 'var(--muted)' }}>
              {isOnline ? 'Recebendo Cotações' : 'Pausado Temporariamente'}
            </b>
            <button
              className="ghost sm"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
              onClick={() => setAvailabilityModalOpen(true)}
            >
              Configurar
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- CONTEÚDO PRINCIPAL ----------------- */}
      <main style={{ flex: 1, padding: '24px var(--g) 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* ==================== ABA 1: PAINEL DA EMPRESA ==================== */}
        {activeTab === 'geral' && (
          <div>
            <div className="sup-dashboard-grid">
              <div className="card" style={{ cursor: 'default' }}>
                <div className="card-head">
                  <span className="eyebrow">CREDENCIADO OFIR · ENGENHARIA & FORNECIMENTO</span>
                  <span className="pill ok">Ativo</span>
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: 20 }}>{currentSup.n} {CHECK_BADGE}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{currentSup.e} · Especialista em {currentSup.s}</p>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span className="chip" style={{ fontSize: 11 }}>
                    <Svg k="star" s={12} color="var(--accent)" /> {currentSup.r} ({currentSup.a} avaliações)
                  </span>
                  <span className="chip" style={{ fontSize: 11 }}>Atende em Campinas e região</span>
                  <span className="chip" style={{ fontSize: 11 }}>Raio de {currentSup.raio} km</span>
                  <span className="chip" style={{ fontSize: 11 }}>Prazo médio: Sob medida</span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Compromisso de SLA OFIR (72 horas)</span>
                    <b style={{ color: 'var(--accent)' }}>98.4% respondidos no prazo</b>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: '98.4%', height: '100%', background: 'var(--accent)' }}></div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                    Manter o SLA abaixo de 72h garante o selo Fornecedor Verificado e prioridade em novas obras.
                  </span>
                </div>
              </div>

              <div className="card" onClick={() => setActiveTab('rfqs')} style={{ cursor: 'pointer' }}>
                <div className="card-head">
                  <span className="ico acc"><Svg k="doc" s={18} /></span>
                  <span className="pill ok">2 novas</span>
                </div>
                <h4 style={{ fontSize: 16, marginTop: 8 }}>Oportunidades & RFQs</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 12px' }}>
                  Clientes enviaram plantas de arquitetura aguardando sua cotação.
                </p>
                <button className="btn sm" style={{ alignSelf: 'flex-start' }}>Ver Solicitações</button>
              </div>

              <div className="card" onClick={() => setActiveTab('proposta')} style={{ cursor: 'pointer' }}>
                <div className="card-head">
                  <span className="ico acc"><Svg k="shield" s={18} /></span>
                  <span className="pill ok">R$ 186.000</span>
                </div>
                <h4 style={{ fontSize: 16, marginTop: 8 }}>Custódia Garantida</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 12px' }}>
                  Pagamento protegido em conta escrow liberado por etapa concluída.
                </p>
                <button className="ghost sm" style={{ alignSelf: 'flex-start' }}>Ver Propostas</button>
              </div>

              <div className="card" onClick={() => setActiveTab('chat')} style={{ cursor: 'pointer' }}>
                <div className="card-head">
                  <span className="ico"><Svg k="msg" s={18} /></span>
                  <span className="pill">1 cliente</span>
                </div>
                <h4 style={{ fontSize: 16, marginTop: 8 }}>Em Negociação</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 12px' }}>
                  O cliente solicitou alinhamento de prazos e valores na proposta.
                </p>
                <button className="ghost sm" style={{ alignSelf: 'flex-start' }}>Abrir Chat</button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 2: OPORTUNIDADES & RFQS ==================== */}
        {activeTab === 'rfqs' && (
          <div>
            <div className="sec-head">
              <div>
                <span className="eyebrow">COTACÕES & DEMANDAS REGIONAIS</span>
                <h2 style={{ fontFamily: 'Source Serif 4, serif', margin: '4px 0 0' }}>Oportunidades Recebidas</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>
                  Solicitações de clientes com projetos de engenharia prontos para orçar.
                </p>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="pill ok">Nova Cotação</span>
                    <span className="pill">Fundação e Sondagem</span>
                  </div>
                  <h3 style={{ margin: '4px 0', fontSize: 18, fontWeight: 700 }}>
                    Casa Térrea 420m² em Atibaia · Cliente: Eduardo Castro
                  </h3>
                  <p style={{ margin: '4px 0', fontSize: 13.5, color: 'var(--text-2)' }}>
                    Local: Atibaia/SP · Prazo pretendido de início: <b>Imediato</b> · Projeto estrutural pronto
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Recebido há 2h</span>
                  <b style={{ display: 'block', color: 'var(--accent)', fontSize: 13 }}>36h restantes no SLA</b>
                </div>
              </div>

              <div className="quote-clock-card" style={{ margin: '14px 0' }}>
                <div className="quote-clock-head">
                  <div className="quote-clock-title-wrap">
                    <Svg k="clock" s={18} color="var(--accent)" />
                    <div>
                      <span className="quote-clock-title">Compromisso de SLA de Resposta</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>Você tem 36 horas restantes para responder e manter seu índice de eficiência</span>
                    </div>
                  </div>
                  <div className="quote-clock-digits-box">
                    <span className="quote-clock-digits" style={{ color: 'var(--accent)' }}>36:18:42</span>
                    <span className="quote-clock-digits-label">(restantes)</span>
                  </div>
                </div>
                <div className="quote-clock-bar-bg">
                  <div className="quote-clock-bar-fill" style={{ width: '50%', background: 'var(--accent)' }}></div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Svg k="doc" s={20} color="var(--accent)" />
                  <div>
                    <b style={{ fontSize: 13, display: 'block' }}>Projeto_Arquitetonico_Atibaia_420m2.pdf</b>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>4.2 MB · Anexado pelo cliente junto à sondagem de solo</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost sm" onClick={() => { setActiveChatId('c1'); setActiveTab('chat'); }}>
                    <Svg k="msg" s={14} /> Abrir Conversa
                  </button>
                  <button className="btn sm" onClick={() => { setPropSubTab('editor'); setActiveTab('proposta'); }}>
                    Formular Proposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 3: EMISSOR DE PROPOSTA COMERCIAL & HISTÓRICO ==================== */}
        {activeTab === 'proposta' && (
          <div>
            <div className="sec-head">
              <div>
                <span className="eyebrow">CONTRATO & SPLIT DE PAGAMENTO</span>
                <h2 style={{ fontFamily: 'Source Serif 4, serif', margin: '4px 0 0' }}>Emissor de Proposta Comercial Oficial</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>
                  Especifique quantidades, valores unitários, formas de pagamento e marcos protegidos de liberação em custódia.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Alternador de Sub-Abas: Editor vs Histórico */}
                <div className="supplier-subtabs">
                  <button
                    type="button"
                    className={propSubTab === 'editor' ? 'active' : ''}
                    onClick={() => setPropSubTab('editor')}
                  >
                    <Svg k="edit" s={14} />
                    {editingPropId ? 'Editando Proposta' : 'Nova Proposta'}
                  </button>
                  <button
                    type="button"
                    className={propSubTab === 'history' ? 'active' : ''}
                    onClick={() => setPropSubTab('history')}
                  >
                    <Svg k="clock" s={14} />
                    Histórico ({supplierProposalHistory.length})
                  </button>
                </div>
              </div>
            </div>

            {/* SUB-ABA: HISTÓRICO DE PROPOSTAS */}
            {propSubTab === 'history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Propostas Emitidas por sua Empresa</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                      Você pode visualizar, editar valores/prazos ou apagar propostas a qualquer momento.
                    </p>
                  </div>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setEditingPropId(null);
                      setPropTitle('Fundação em Radier 420m²');
                      setPropSubTab('editor');
                    }}
                  >
                    <Svg k="clip" s={14} /> Criar Nova Proposta
                  </button>
                </div>

                {supplierProposalHistory.length === 0 ? (
                  <div className="panel" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                    <Svg k="doc" s={36} color="var(--muted)" />
                    <h4 style={{ margin: '12px 0 4px', color: 'var(--text)' }}>Nenhuma proposta emitida ainda</h4>
                    <p style={{ margin: 0, fontSize: 13 }}>Crie sua primeira proposta comercial para um cliente ativo.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {supplierProposalHistory.map(prop => {
                      const tot = prop.rows.reduce((a, b) => a + b[1], 0);
                      const conv = conversations.find(c => c.id === prop.conv);
                      const isPaid = prop.status === 'paid';
                      const isNegotiating = conv?.msgs.some(m => m.x?.toLowerCase().includes('negociar'));

                      return (
                        <div key={prop.id} className="proposal-history-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span className="pill" style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{prop.id}</span>
                                <span className={`pill ${isPaid ? 'ok' : isNegotiating ? '' : 'ok'}`} style={isNegotiating ? { background: 'rgba(217,119,6,.15)', color: 'var(--accent)' } : undefined}>
                                  {isPaid ? 'Contrato Fechado & Pago' : isNegotiating ? 'Negociação Solicitada' : 'Aguardando Aprovação'}
                                </span>
                                <span className="pill" style={{ background: 'var(--surface-2)' }}>
                                  {prop.deliveryDays ? `${prop.deliveryDays} dias úteis` : '26 dias úteis'}
                                </span>
                              </div>
                              <h4 style={{ margin: '4px 0', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                                {prop.title}
                              </h4>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
                                Cliente: <b>{conv ? 'Eduardo Castro' : 'Cliente OFIR'}</b> · {prop.meta}
                              </p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Valor Total Protegido</span>
                              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', fontFamily: 'ui-monospace, monospace' }}>
                                {BRLc(tot)}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                {prop.rows.length} etapas no split de custódia
                              </span>
                            </div>
                          </div>

                          {/* Ações da Proposta no Histórico */}
                          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="ghost sm"
                                onClick={() => setPreviewProp(prop)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              >
                                <Svg k="doc" s={14} /> Ver Prévia Oficial
                              </button>
                              <button
                                className="btn sm"
                                onClick={() => handleEditProposal(prop)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              >
                                <Svg k="edit" s={14} /> Editar Proposta
                              </button>
                              <button
                                className="ghost sm"
                                onClick={() => {
                                  setActiveChatId(prop.conv);
                                  setActiveTab('chat');
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              >
                                <Svg k="msg" s={14} /> Conversa com Cliente
                              </button>
                            </div>

                            <button
                              className="ghost sm"
                              onClick={() => handleDeleteProposal(prop.id)}
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <Svg k="trash" s={14} color="#ef4444" /> Apagar Proposta
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA: EDITOR DE PROPOSTAS */}
            {propSubTab === 'editor' && (
              <div className="prop-builder-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Bloco 1: Dados Gerais e Prazos */}
                  <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="eyebrow">1. IDENTIFICAÇÃO E PRAZO DE ENTREGA</span>
                      {editingPropId && (
                        <span className="pill ok" style={{ fontSize: 11 }}>
                          Modo Edição: #{editingPropId}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="inp">
                        <label>Título do Serviço / Contrato</label>
                        <input
                          type="text"
                          value={propTitle}
                          onChange={e => setPropTitle(e.target.value)}
                          placeholder="Ex: Fundação em Radier 420m²"
                        />
                      </div>

                      <div className="inp">
                        <label>Especificações Técnicas Gerais (Memorial Resumido)</label>
                        <input
                          type="text"
                          value={propMeta}
                          onChange={e => setPropMeta(e.target.value)}
                          placeholder="Ex: 420 m² · Armação e concretagem usinada inclusos"
                        />
                      </div>

                      {/* Prazo de Entrega e Mobilização */}
                      <div className="prop-timing-grid">
                        <div className="inp">
                          <label>Prazo de Execução (Dias Úteis)</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min={1}
                              value={deliveryDays}
                              onChange={e => setDeliveryDays(Math.max(1, Number(e.target.value)))}
                              style={{ paddingRight: 74 }}
                            />
                            <span style={{ position: 'absolute', right: 10, top: 11, fontSize: 11.5, color: 'var(--muted)', pointerEvents: 'none' }}>
                              dias úteis
                            </span>
                          </div>
                        </div>

                        <div className="inp">
                          <label>Início da Mobilização na Obra</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min={1}
                              value={deliveryStartDays}
                              onChange={e => setDeliveryStartDays(Math.max(1, Number(e.target.value)))}
                              style={{ paddingRight: 74 }}
                            />
                            <span style={{ position: 'absolute', right: 10, top: 11, fontSize: 11.5, color: 'var(--muted)', pointerEvents: 'none' }}>
                              dias pós-depósito
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Itens Detalhados (Separar bem Quantidade e Valor) */}
                  <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span className="eyebrow">2. ITENS, QUANTIDADES & VALORES UNITÁRIOS</span>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
                          Discrimine cada insumo ou serviço com unidade, quantidade e preço de referência.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="ghost sm"
                          onClick={() => setActiveTab('catalogo')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Svg k="building" s={13} /> Puxar do Catálogo
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          onClick={handleAddPropItem}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Svg k="clip" s={13} /> Adicionar Linha
                        </button>
                      </div>
                    </div>

                    <div className="prop-items-table-wrapper">
                      <table className="prop-items-table">
                        <thead>
                          <tr>
                            <th style={{ width: '42%' }}>Item / Serviço de Engenharia</th>
                            <th style={{ width: '14%' }}>Unidade</th>
                            <th style={{ width: '16%' }}>Quantidade</th>
                            <th style={{ width: '18%' }}>Preço Unit. (R$)</th>
                            <th style={{ width: '16%', textAlign: 'right' }}>Total (R$)</th>
                            <th style={{ width: '6%', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {propItems.map((item, idx) => (
                            <tr key={item.id}>
                              <td>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => handleUpdateItemField(idx, 'name', e.target.value)}
                                  placeholder="Descrição do serviço"
                                />
                              </td>
                              <td>
                                <select
                                  value={item.unit}
                                  onChange={e => handleUpdateItemField(idx, 'unit', e.target.value)}
                                >
                                  <option value="m²">m²</option>
                                  <option value="m³">m³</option>
                                  <option value="m">m</option>
                                  <option value="kg">kg</option>
                                  <option value="un">un</option>
                                  <option value="vb">vb (verba)</option>
                                  <option value="dia">dia</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={e => handleUpdateItemField(idx, 'qty', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={e => handleUpdateItemField(idx, 'unitPrice', e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>
                                {BRLc(item.total)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="ghost sq"
                                  onClick={() => handleRemovePropItem(idx)}
                                  title="Remover item"
                                  style={{ width: 28, height: 28, padding: 0 }}
                                >
                                  <Svg k="trash" s={13} color="#ef4444" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: 'var(--surface-2)' }}>
                            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, padding: '10px 14px' }}>
                              Subtotal dos Itens Orçados:
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--accent)', padding: '10px 14px' }}>
                              {BRLc(propTotal)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Bloco 3: Formas de Pagamento Aceitas */}
                  <div className="panel">
                    <span className="eyebrow">3. CONDIÇÕES & FORMAS DE PAGAMENTO</span>
                    <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--muted)' }}>
                      Escolha a modalidade financeira que será oferecida no contrato ao cliente.
                    </p>

                    <div className="pay-method-grid">
                      {PAYMENT_METHODS.map(pm => (
                        <div
                          key={pm.key}
                          className={`pay-method-card ${paymentMethod === pm.key ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(pm.key)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5 }}>
                              <Svg k={pm.icon} s={16} color="var(--accent)" />
                              {pm.label}
                            </div>
                            <span className="pill ok" style={{ fontSize: 10 }}>{pm.badge}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>
                            {pm.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bloco 4: Divisão de Como Será o Pagamento (Marcos Físicos) */}
                  <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <span className="eyebrow">4. DIVISÃO DO PAGAMENTO POR MARCOS (SPLIT DE CUSTÓDIA)</span>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
                          O valor de cada etapa só é liberado à sua conta após a comprovação e aceite na obra.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ghost sm"
                        onClick={handleAddMilestone}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Svg k="clip" s={13} /> Adicionar Etapa
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {milestones.map((m, idx) => (
                        <div
                          key={m.id}
                          style={{
                            background: 'var(--surface-2)',
                            borderRadius: 10,
                            padding: '12px 14px',
                            border: '1px solid var(--line-2)'
                          }}
                        >
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={m.name}
                              onChange={e => handleUpdateMilestone(idx, e.target.value, m.percent, m.condition)}
                              style={{ flex: 1, minWidth: 200, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}
                              placeholder="Nome da etapa"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={m.percent}
                                onChange={e => handleUpdateMilestone(idx, m.name, Number(e.target.value), m.condition)}
                                style={{ width: 68, height: 36, padding: '0 8px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, textAlign: 'center', fontWeight: 700 }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>%</span>
                            </div>
                            <div style={{ width: 130, textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}>
                              {BRLc(m.amount)}
                            </div>
                            <button
                              type="button"
                              className="ghost sq"
                              onClick={() => handleRemoveMilestone(idx)}
                              title="Remover etapa"
                              style={{ width: 32, height: 32, padding: 0 }}
                            >
                              <Svg k="trash" s={13} color="#ef4444" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={m.condition}
                            onChange={e => handleUpdateMilestone(idx, m.name, m.percent, e.target.value)}
                            style={{ width: '100%', height: 32, padding: '0 10px', borderRadius: 6, border: '1px dashed var(--line-2)', background: 'transparent', color: 'var(--muted)', fontSize: 12 }}
                            placeholder="Gatilho de liberação (Ex: Conclusão da armação e relatório de concretagem)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna da Direita: Prévia Oficial no padrão .prop da OFIR */}
                <div className="prop-preview-col">
                  <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>
                    PRÉVIA DO QUE O CLIENTE VERÁ NO CHAT:
                  </span>

                  <div className="prop" style={{ margin: 0, boxShadow: '0 8px 30px rgba(0,0,0,.08)' }}>
                    <div className="prop-head">
                      <span className="eyebrow">Solicitação de pagamento</span>
                      <span className="pill">Aguardando cliente</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                      <span className="pill ok" style={{ fontSize: 11 }}>
                        Prazo: {deliveryDays} dias úteis
                      </span>
                      <span className="pill" style={{ fontSize: 11 }}>
                        Início em {deliveryStartDays} dias
                      </span>
                    </div>

                    <h4>{propTitle}</h4>
                    <p className="pm">{propMeta}</p>

                    {/* Resumo dos Itens */}
                    <div style={{ margin: '10px 0', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Composição do Valor ({propItems.length} itens)
                      </div>
                      {propItems.map(it => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                          <span style={{ color: 'var(--text-2)' }}>{it.name} ({it.qty} {it.unit})</span>
                          <b style={{ color: 'var(--text)' }}>{BRLc(it.total)}</b>
                        </div>
                      ))}
                    </div>

                    {/* Divisão de Como Será o Pagamento */}
                    <div className="rows">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Divisão de Pagamento (Marcos Físicos)
                      </div>
                      {milestones.map(r => (
                        <div key={r.id}>
                          <span>{r.name} ({r.percent}%)</span>
                          <b>{BRLc(r.amount)}</b>
                        </div>
                      ))}
                      <div className="tot">
                        <span>Total da Proposta</span>
                        <b>{BRLc(propTotal)}</b>
                      </div>
                    </div>

                    <div className="escrow">
                      <b>{BRLc(propTotal)} protegido pela OFIR.</b> O pagamento de cada etapa fica seguro em custódia e é liberado à sua empresa conforme o cliente valida o término físico.
                    </div>

                    {/* Forma de pagamento escolhida */}
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)' }}>Forma aceita:</span>
                      <strong style={{ color: 'var(--text)' }}>
                        {PAYMENT_METHODS.find(p => p.key === paymentMethod)?.label}
                      </strong>
                    </div>

                    <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                        <span>Taxa de custódia e garantia OFIR (3%):</span>
                        <span>- {BRLc(platformFee)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent)', marginTop: 4, fontSize: 13.5 }}>
                        <span>Líquido a receber:</span>
                        <span>{BRLc(netSupplierValue)}</span>
                      </div>
                    </div>

                    <div className="prop-acts" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="btn" type="button" onClick={handleSaveOrSendProposal} style={{ width: '100%', height: 46 }}>
                        {editingPropId ? 'Salvar Alterações e Reenviar Proposta' : 'Enviar Proposta Oficial ao Cliente'}
                      </button>

                      {editingPropId && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              setEditingPropId(null);
                              setPropSubTab('history');
                            }}
                            style={{ flex: 1 }}
                          >
                            Cancelar Edição
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleDeleteProposal(editingPropId)}
                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,.3)' }}
                          >
                            Apagar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ABA 4: NEGOCIAÇÕES & CHAT (PADRÃO OFIR) ==================== */}
        {activeTab === 'chat' && (
          <div>
            <div className="sec-head">
              <div>
                <span className="eyebrow">CENTRAL DE MENSAGENS E NEGOCIAÇÃO</span>
                <h2 style={{ fontFamily: 'Source Serif 4, serif', margin: '4px 0 0' }}>Bate-papo com o Cliente</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>
                  Responda a dúvidas, negocie prazos e reenvie propostas com os ajustes solicitados.
                </p>
              </div>
            </div>

            <div className="supplier-chat-container">
              {/* Sidebar das Conversas */}
              <div className="supplier-chat-sidebar">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: 13, background: 'var(--bg)' }}>
                  Conversas Ativas ({supConvs.length})
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {supConvs.map(c => {
                    const lastMsg = c.msgs[c.msgs.length - 1];
                    const isNegotiating = c.msgs.some(m => m.x?.toLowerCase().includes('negociar') || m.x?.toLowerCase().includes('ajustar'));
                    return (
                      <div
                        key={c.id}
                        className={`supplier-conv-row ${c.id === activeChatId ? 'active' : ''}`}
                        onClick={() => setActiveChatId(c.id)}
                      >
                        <div className="av media m1" style={{ width: 40, height: 40, borderRadius: 8, flex: 'none' }}></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <b style={{ fontSize: 13.5, color: 'var(--text)' }}>Eduardo Castro</b>
                            <small style={{ fontSize: 11, color: 'var(--muted)' }}>{c.time}</small>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lastMsg?.t === 'prop' ? 'Proposta comercial enviada' : (lastMsg?.x || 'Iniciou cotação')}
                          </p>
                          {isNegotiating && (
                            <span className="pill" style={{ fontSize: 10, padding: '1px 6px', marginTop: 4, display: 'inline-block', background: 'rgba(217,119,6,.12)', color: 'var(--accent)' }}>
                              Negociação em andamento
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Janela de Mensagens */}
              <div className="supplier-chat-main">
                {/* Topo do Chat */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                  <div>
                    <strong style={{ fontSize: 15, display: 'block', color: 'var(--text)' }}>
                      Eduardo Castro · Obra Casa Térrea 420m²
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Atibaia/SP · Pagamento em Custódia pela OFIR
                    </span>
                  </div>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setPropSubTab('editor');
                      setActiveTab('proposta');
                    }}
                  >
                    Editar / Reenviar Proposta
                  </button>
                </div>

                {/* Mensagens com as classes canônicas da OFIR */}
                <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="day">Hoje</div>

                  {activeConv?.msgs.map((m, idx) => {
                    if (m.t === 'sys') {
                      return <div key={idx} className="sys">{m.x}</div>;
                    }

                    if (m.t === 'prop') {
                      const p = proposals[m.id!];
                      if (!p) return null;
                      const tot = p.rows.reduce((acc, r) => acc + r[1], 0);
                      return (
                        <div key={idx} className="prop" style={{ maxWidth: 440, alignSelf: 'flex-end' }}>
                          <div className="prop-head">
                            <span className="eyebrow">Sua Proposta Enviada</span>
                            <span className="pill ok">{p.status === 'open' ? 'Aguardando cliente' : 'Contrato fechado'}</span>
                          </div>
                          <h4>{p.title}</h4>
                          <p className="pm">{p.meta}</p>
                          <div className="rows">
                            {p.rows.map(r => (
                              <div key={r[0]}><span>{r[0]}</span><b>{BRLc(r[1])}</b></div>
                            ))}
                            <div className="tot"><span>Total</span><b>{BRLc(tot)}</b></div>
                          </div>
                          <div className="escrow">
                            <b>{BRLc(tot)} em custódia.</b> Liberado conforme as etapas forem concluídas.
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              className="ghost sm"
                              onClick={() => handleEditProposal(p)}
                              style={{ fontSize: 11, padding: '3px 8px' }}
                            >
                              <Svg k="edit" s={12} /> Editar
                            </button>
                            <button
                              className="ghost sm"
                              onClick={() => handleDeleteProposal(p.id)}
                              style={{ fontSize: 11, padding: '3px 8px', color: '#ef4444' }}
                            >
                              <Svg k="trash" s={12} color="#ef4444" /> Apagar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isMine = m.t === 'them';

                    return (
                      <div
                        key={idx}
                        className={`msg ${isMine ? 'me' : 'them'}`}
                        style={{
                          background: isMine ? 'var(--accent)' : 'var(--surface-2)',
                          color: isMine ? 'var(--accent-ink)' : 'var(--text)',
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          borderRadius: 14,
                          padding: '10px 14px',
                          fontSize: 13.5
                        }}
                      >
                        {!isMine && (
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 2 }}>
                            Cliente (Eduardo Castro)
                          </div>
                        )}
                        <div>{m.x}</div>
                        <time style={{ fontSize: 10, opacity: 0.7, textAlign: 'right', display: 'block', marginTop: 4 }}>
                          {m.h}
                        </time>
                      </div>
                    );
                  })}
                </div>

                {/* Formulário de Envio Canônico (.composer) */}
                <form className="composer" style={{ display: 'flex', borderTop: '1px solid var(--line)', padding: '10px 16px', background: 'var(--surface)' }} onSubmit={handleSendMessage}>
                  <input
                    placeholder="Responda ao cliente para negociar prazos ou valores..."
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text)' }}
                  />
                  <button className="btn" type="submit" aria-label="Enviar mensagem">
                    <Svg k="next" s={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 5: TABELA DE PREÇOS TOTALMENTE FUNCIONAL ==================== */}
        {activeTab === 'catalogo' && (
          <div>
            <div className="sec-head">
              <div>
                <span className="eyebrow">CATÁLOGO DE SERVIÇOS & INSUMOS</span>
                <h2 style={{ fontFamily: 'Source Serif 4, serif', margin: '4px 0 0' }}>Tabela de Preços Cadastrada</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>
                  Gerencie itens com preços unitários de referência para alimentar cotações e propostas rápidas.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn"
                  onClick={openAddCatalogModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Svg k="building" s={15} /> Adicionar Item ao Catálogo
                </button>
              </div>
            </div>

            {/* Filtros e Busca Rápida */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 420 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Buscar serviço ou insumo por nome ou unidade..."
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 36px 0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--line-2)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13
                    }}
                  />
                  <div style={{ position: 'absolute', right: 10, top: 11, pointerEvents: 'none', opacity: 0.5 }}>
                    <Svg k="search" s={16} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <span>Total: <b>{currentCatalogList.length} itens</b></span>
              </div>
            </div>

            {/* Tabela de Preços com Ações Reais */}
            <div className="panel" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="ot items" style={{ width: '100%', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Item / Serviço de Engenharia</th>
                    <th>Unidade</th>
                    <th>Qtd. Estimada Sugerida</th>
                    <th style={{ textAlign: 'right' }}>Preço Unitário de Referência</th>
                    <th style={{ textAlign: 'center', width: 180 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCatalogList.length > 0 ? (
                    currentCatalogList.map(item => (
                      <tr key={item.id}>
                        <td>
                          <b style={{ color: 'var(--text)' }}>{item.name}</b>
                          {item.description && (
                            <small style={{ display: 'block', color: 'var(--muted)', marginTop: 2, fontSize: 12, lineHeight: 1.35 }}>
                              {item.description}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className="pill" style={{ fontSize: 11 }}>{item.unit}</span>
                        </td>
                        <td>
                          <b>{item.suggestedQty}</b> {item.unit}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 15, fontFamily: 'ui-monospace, monospace' }}>
                          {BRLc(item.unitPrice)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="ghost sm"
                              onClick={() => handleUseCatalogItemInProposal(item)}
                              title="Adicionar item à proposta em elaboração"
                              style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent)' }}
                            >
                              + Proposta
                            </button>
                            <button
                              type="button"
                              className="ghost sq"
                              onClick={() => openEditCatalogModal(item)}
                              title="Editar este item"
                              style={{ width: 30, height: 30, padding: 0 }}
                            >
                              <Svg k="edit" s={14} />
                            </button>
                            <button
                              type="button"
                              className="ghost sq"
                              onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                              title="Excluir este item"
                              style={{ width: 30, height: 30, padding: 0 }}
                            >
                              <Svg k="trash" s={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        <Svg k="building" s={32} color="var(--muted)" />
                        <h4 style={{ margin: '8px 0 4px', color: 'var(--text)' }}>Nenhum item cadastrado</h4>
                        <p style={{ margin: 0, fontSize: 13 }}>Clique em "Adicionar Item ao Catálogo" para definir sua tabela de preços.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ==================== MODAL: ADICIONAR / EDITAR ITEM DO CATÁLOGO ==================== */}
      {catalogModalOpen && (
        <div className="supplier-modal-scrim" onClick={() => setCatalogModalOpen(false)}>
          <div className="supplier-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--portal-badge-bg)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Svg k="building" s={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  {editingCatalogItem ? 'Editar Item do Catálogo' : 'Adicionar Item ao Catálogo'}
                </h3>
              </div>
              <button
                type="button"
                className="ghost sq"
                onClick={() => setCatalogModalOpen(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                <Svg k="x" s={14} />
              </button>
            </div>

            <form onSubmit={handleSaveCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="inp">
                <label>Nome do Serviço ou Insumo de Engenharia *</label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={e => setCatFormName(e.target.value)}
                  placeholder="Ex: Fundação em Radier Armado fck 30 MPa"
                />
              </div>

              <div className="modal-tri-grid">
                <div className="inp">
                  <label>Unidade *</label>
                  <select
                    value={catFormUnit}
                    onChange={e => setCatFormUnit(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--surface-2)', color: 'var(--text)', padding: '0 8px' }}
                  >
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="un">un</option>
                    <option value="vb">vb (verba)</option>
                    <option value="dia">dia</option>
                  </select>
                </div>

                <div className="inp">
                  <label>Qtd. Sugerida *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={catFormQty}
                    onChange={e => setCatFormQty(Number(e.target.value))}
                  />
                </div>

                <div className="inp">
                  <label>Preço Unit. (R$) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={catFormPrice}
                    onChange={e => setCatFormPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="inp">
                <label>Memorial Descritivo / Especificação Técnica</label>
                <textarea
                  rows={3}
                  value={catFormDesc}
                  onChange={e => setCatFormDesc(e.target.value)}
                  placeholder="Detalhes sobre insumos inclusos, norma técnica NBR, equipamentos e maquinário..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--line-2)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setCatalogModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                >
                  {editingCatalogItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: PRÉVIA OFICIAL DA PROPOSTA ==================== */}
      {previewProp && (
        <div className="supplier-modal-scrim" onClick={() => setPreviewProp(null)}>
          <div className="supplier-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span className="eyebrow">DOCUMENTO OFICIAL DA OFIR</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700 }}>
                  {previewProp.title}
                </h3>
              </div>
              <button
                type="button"
                className="ghost sq"
                onClick={() => setPreviewProp(null)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                <Svg k="x" s={14} />
              </button>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Status da Proposta:</span>
                <span className="pill ok">{previewProp.status === 'open' ? 'Aguardando Aprovação' : 'Aprovada'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                <span style={{ color: 'var(--muted)' }}>Prazo de Execução:</span>
                <b>{previewProp.deliveryDays ? `${previewProp.deliveryDays} dias úteis` : '26 dias úteis'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                <span style={{ color: 'var(--muted)' }}>Condição de Pagamento:</span>
                <b>{previewProp.paymentMethod ? PAYMENT_METHODS.find(p => p.key === previewProp.paymentMethod)?.label : 'PIX via Custódia OFIR'}</b>
              </div>
            </div>

            <div className="rows" style={{ margin: '14px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Marcos Físicos & Liberação de Valores:
              </div>
              {previewProp.rows.map(r => (
                <div key={r[0]}>
                  <span>{r[0]}</span>
                  <b>{BRLc(r[1])}</b>
                </div>
              ))}
              <div className="tot">
                <span>Total Geral:</span>
                <b>{BRLc(previewProp.rows.reduce((a, b) => a + b[1], 0))}</b>
              </div>
            </div>

            <div className="escrow">
              <b>Garantia OFIR Escrow:</b> Os valores depositados ficam protegidos e só são liberados à sua empresa mediante aprovação física das etapas pelo cliente.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                className="ghost"
                onClick={() => setPreviewProp(null)}
              >
                Fechar Prévia
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPreviewProp(null);
                  handleEditProposal(previewProp);
                }}
              >
                <Svg k="edit" s={14} /> Editar Esta Proposta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: CONTA ESCROW & RECEBÍVEIS B2B ==================== */}
      {escrowModalOpen && (
        <div className="supplier-modal-scrim" onClick={() => setEscrowModalOpen(false)}>
          <div className="supplier-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--portal-badge-bg)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Svg k="shield" s={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Conta Escrow & Recebíveis Garantidos</h3>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Custódia financeira protegida por contrato OFIR</span>
                </div>
              </div>
              <button
                type="button"
                className="ghost sq"
                onClick={() => setEscrowModalOpen(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                <Svg k="x" s={14} />
              </button>
            </div>

            {/* Grid de Saldos em Custódia */}
            <div className="escrow-stats-grid">
              <div style={{ background: 'var(--surface-2)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line-2)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Total sob Custódia</span>
                <b style={{ fontSize: 19, color: 'var(--text)', fontFamily: 'ui-monospace, monospace', display: 'block', marginTop: 4 }}>
                  {BRLc(releasedBalance + inEscrowBalance)}
                </b>
                <span className="pill ok" style={{ fontSize: 9.5, padding: '1px 5px', marginTop: 4, display: 'inline-block' }}>100% Garantido</span>
              </div>

              <div style={{ background: 'var(--portal-badge-bg)', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(30,58,138,0.2)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', display: 'block' }}>Liberado p/ Transferência</span>
                <b style={{ fontSize: 19, color: 'var(--accent)', fontFamily: 'ui-monospace, monospace', display: 'block', marginTop: 4 }}>
                  {BRLc(releasedBalance)}
                </b>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>Etapas aprovadas</span>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line-2)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Em Execução na Obra</span>
                <b style={{ fontSize: 19, color: 'var(--text-2)', fontFamily: 'ui-monospace, monospace', display: 'block', marginTop: 4 }}>
                  {BRLc(inEscrowBalance)}
                </b>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>2 etapas restantes</span>
              </div>
            </div>

            {/* Extrato de Marcos do Contrato Ativo */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="eyebrow">MARCOS VINCULADOS AO CONTRATO #PROP-842</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Obra Casa Térrea 420m² (Eduardo Castro)</span>
              </div>

              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 600 }}>
                  <span>Etapa / Descrição</span>
                  <span>Valor Líquido</span>
                  <span>Status do Marco</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <div>
                    <b>Etapa 1 · Sondagem e Escavação</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>Locação e laudo de subleito validados</small>
                  </div>
                  <b style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--ok)' }}>R$ 58.200,00</b>
                  <span className="pill ok" style={{ fontSize: 11 }}>Liberado para Saque</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <div>
                    <b>Etapa 2 · Armação de Aço e Concretagem</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>Em execução física no canteiro de obras</small>
                  </div>
                  <b style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>R$ 96.800,00</b>
                  <span className="pill" style={{ fontSize: 11 }}>Em Andamento</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', fontSize: 13 }}>
                  <div>
                    <b>Etapa 3 · Cura, Desforma e Liberação de Carga</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>Programado pós-ensaio de 28 dias</small>
                  </div>
                  <b style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--muted)' }}>R$ 31.000,00</b>
                  <span className="pill" style={{ fontSize: 11, opacity: 0.7 }}>Aguardando</span>
                </div>
              </div>
            </div>

            {/* Dados Bancários PJ para Repasse Automático */}
            <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Conta PJ de Liquidação dos Repasses (D+0)
                </span>
                <span className="pill ok" style={{ fontSize: 10 }}>Conta Verificada</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                <b>Banco Itaú Unibanco (341)</b> · Agência: 1240 · Conta Corrente PJ: 48910-2
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Favorecido: {currentSup.n} Ltda · CNPJ: 24.891.302/0001-44 · Chave PIX: financeiro@{currentSup.n.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br
              </div>
            </div>

            {/* Ações do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="ghost"
                onClick={() => setEscrowModalOpen(false)}
              >
                Fechar Extrato
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleRequestEscrowPayout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Svg k="shield" s={15} /> Transferir Saldo Liberado ({BRLc(releasedBalance)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: RAIO DE ATUAÇÃO & LOGÍSTICA REGIONAL ==================== */}
      {radiusModalOpen && (
        <div className="supplier-modal-scrim" onClick={() => setRadiusModalOpen(false)}>
          <div className="supplier-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--portal-badge-bg)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Svg k="pin" s={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Raio de Atendimento & Cobertura</h3>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Controle de raio geográfico e cidades atendidas</span>
                </div>
              </div>
              <button
                type="button"
                className="ghost sq"
                onClick={() => setRadiusModalOpen(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                <Svg k="x" s={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Slider de Raio */}
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 12, border: '1px solid var(--line-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Raio Máximo de Cobertura da Base</label>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', fontFamily: 'ui-monospace, monospace' }}>
                    {coverageRadius} km
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={coverageRadius}
                  onChange={e => setCoverageRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  <span>10 km (Apenas local)</span>
                  <span>Área estimada: ~{Math.round(Math.PI * Math.pow(coverageRadius, 2)).toLocaleString('pt-BR')} km²</span>
                  <span>300 km (Regional amplo)</span>
                </div>
              </div>

              {/* Lista Interativa de Cidades */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  Municípios de Atendimento Prioritário ({coverageCities.length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line-2)', minHeight: 70 }}>
                  {coverageCities.map(city => (
                    <span
                      key={city}
                      className="chip"
                      style={{ fontSize: 12, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)' }}
                    >
                      <Svg k="pin" s={12} color="var(--accent)" />
                      {city}
                      <button
                        type="button"
                        onClick={() => handleRemoveCoverageCity(city)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', display: 'grid', placeItems: 'center' }}
                        title={`Remover ${city}`}
                      >
                        <Svg k="x" s={11} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Formulário para Adicionar Cidade */}
                <form onSubmit={handleAddCoverageCity} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    value={newCityInput}
                    onChange={e => setNewCityInput(e.target.value)}
                    placeholder="Adicionar outro município (ex: Paulínia, Sorocaba)..."
                    style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                  />
                  <button type="submit" className="ghost sm" style={{ height: 38, whiteSpace: 'nowrap' }}>
                    + Adicionar
                  </button>
                </form>
              </div>

              {/* Política de Frete e Deslocamento */}
              <div className="inp">
                <label>Política de Mobilização e Deslocamento</label>
                <select
                  value={freightPolicy}
                  onChange={e => setFreightPolicy(e.target.value)}
                  style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--surface-2)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }}
                >
                  <option value="included">Mobilização e frete 100% inclusos no raio cadastrado</option>
                  <option value="km_extra">Adicional de R$ 4,50 por km fora do raio de 50km</option>
                  <option value="quote">Frete calculado sob medida conforme a rota da carga</option>
                </select>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="ghost"
                onClick={() => setRadiusModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleSaveCoverageSettings}
              >
                Salvar Configurações de Atuação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: DISPONIBILIDADE & CAPACIDADE DE ATENDIMENTO ==================== */}
      {availabilityModalOpen && (
        <div className="supplier-modal-scrim" onClick={() => setAvailabilityModalOpen(false)}>
          <div className="supplier-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--portal-badge-bg)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Svg k="settings" s={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Disponibilidade & Capacidade</h3>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Visibilidade regional e controle de demandas</span>
                </div>
              </div>
              <button
                type="button"
                className="ghost sq"
                onClick={() => setAvailabilityModalOpen(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                <Svg k="x" s={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Card de Status Principal */}
              <div className="modal-duo-grid">
                <div
                  onClick={() => setIsOnline(true)}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px solid ${isOnline ? 'var(--ok)' : 'var(--line-2)'}`,
                    background: isOnline ? 'rgba(22, 101, 52, 0.08)' : 'var(--surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ok)' }}></span>
                    <b style={{ fontSize: 14, color: 'var(--text)' }}>Recebendo Cotações</b>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>
                    Sua empresa aparece na busca da região e recebe novas plantas e RFQs.
                  </p>
                </div>

                <div
                  onClick={() => setIsOnline(false)}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px solid ${!isOnline ? 'var(--accent)' : 'var(--line-2)'}`,
                    background: !isOnline ? 'rgba(30, 58, 138, 0.08)' : 'var(--surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--muted)' }}></span>
                    <b style={{ fontSize: 14, color: 'var(--text)' }}>Pausado Temporariamente</b>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>
                    Novas solicitações são suspensas sem impactar seus contratos em andamento.
                  </p>
                </div>
              </div>

              {/* Motivo da Pausa (se pausado) */}
              {!isOnline && (
                <div className="inp">
                  <label>Motivo da Pausa Operacional</label>
                  <select
                    value={pauseReason}
                    onChange={e => setPauseReason(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--surface-2)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }}
                  >
                    <option value="capacity">Capacidade máxima de equipes atingida para este mês</option>
                    <option value="vacation">Férias coletivas ou recesso de final de ano</option>
                    <option value="maintenance">Manutenção preventiva de frotas e perfuratrizes</option>
                    <option value="other">Outro alinhamento interno da diretoria</option>
                  </select>
                </div>
              )}

              {/* Capacidade Simultânea de Obras */}
              <div className="modal-duo-grid">
                <div className="inp">
                  <label>Capacidade Simultânea de Obras</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxConcurrentProjects}
                    onChange={e => setMaxConcurrentProjects(Math.max(1, Number(e.target.value)))}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                    Atualmente 2 de {maxConcurrentProjects} vagas preenchidas
                  </small>
                </div>

                <div className="inp">
                  <label>Tempo Médio de Resposta (SLA)</label>
                  <select
                    value={responseSlaHours}
                    onChange={e => setResponseSlaHours(Number(e.target.value))}
                    style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--surface-2)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }}
                  >
                    <option value={24}>Até 24 horas (Alta Prioridade)</option>
                    <option value={48}>Até 48 horas (Recomendado)</option>
                    <option value={72}>Até 72 horas (Padrão OFIR)</option>
                  </select>
                  <small style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                    Compromisso contratual com clientes
                  </small>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="ghost"
                onClick={() => setAvailabilityModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleSaveAvailabilitySettings}
              >
                Salvar Disponibilidade Operacional
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
