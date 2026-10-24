import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, Image, Modal, Platform,
  Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Svg, { Path, Rect, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import {
  BRLc, ICONS, MEDIA, PLANS, STAGES, STAGE_COUNT, SUPPLIERS, SYSTEMS, STANDARDS,
  catOf, filterSuppliers, filterSummary, getSupplierDetails, initials, rate,
  segList, simulate, stageName, sysName, useOrc, useStore, calcQuoteCountdown,
  calc24hCancellation,
  analyzeProject, catLabel, fmtBytes, serves, ProjectAIError,
  type Address, type Supplier, type SupplierDetails, type QuoteCountdown,
  type Order, type Conversation, type Message, type Proposal, type Quote, type OrcItem,
  type ChecklistItem, type ProjectAnalysis, type SupplierConsultancy
} from '@ofirapp/core';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ---------- Paletas de Cores Claro & Escuro ---------- */
interface ThemeColors {
  bg: string;
  surface: string;
  s2: string;
  s3: string;
  line: string;
  line2: string;
  text: string;
  t2: string;
  muted: string;
  accent: string;
  accent2: string;
  accentInk: string;
  accentSubtle: string;
  accentBorder: string;
  ok: string;
  warn: string;
  card: string;
  skeleton: string;
  statusBarStyle: 'dark' | 'light';
}

const THEMES: Record<'light' | 'dark', ThemeColors> = {
  light: {
    bg: '#f6f5f2',
    surface: '#ffffff',
    s2: '#f1f0ec',
    s3: '#e9e7e2',
    line: 'rgba(20,20,18,.08)',
    line2: 'rgba(20,20,18,.14)',
    text: '#16171a',
    t2: '#45474d',
    muted: '#7a7c82',
    accent: '#174a40',
    accent2: '#0f3a32',
    accentInk: '#ffffff',
    accentSubtle: 'rgba(23,74,64,.08)',
    accentBorder: 'rgba(23,74,64,.24)',
    ok: '#1f7a55',
    warn: '#b42318',
    card: '#ffffff',
    skeleton: '#e4e2dd',
    statusBarStyle: 'dark',
  },
  dark: {
    bg: '#0f1113',
    surface: '#181b1f',
    s2: '#202428',
    s3: '#2a3036',
    line: 'rgba(255,255,255,.08)',
    line2: 'rgba(255,255,255,.14)',
    text: '#f2f4f6',
    t2: '#b8bcc2',
    muted: '#868b92',
    accent: '#267b6b',
    accent2: '#195c50',
    accentInk: '#ffffff',
    accentSubtle: 'rgba(38,123,107,.18)',
    accentBorder: 'rgba(38,123,107,.36)',
    ok: '#2cb07b',
    warn: '#ef4444',
    card: '#181b1f',
    skeleton: '#22262b',
    statusBarStyle: 'light',
  }
};

interface ThemeCtx {
  C: ThemeColors;
  st: ReturnType<typeof getStyles>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeCtx>({
  C: THEMES.light,
  st: {} as any,
  theme: 'light',
  toggleTheme: () => {},
  fontsLoaded: false,
});

const useTheme = () => useContext(ThemeContext);

/* ---------- Primitives & Icons ---------- */
const Icon = ({ k, s = 20, color, sw = 2 }: { k: string; s?: number; color?: string; sw?: number }) => {
  const { C } = useTheme();
  const d = ICONS[k];
  if (!d) return null;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={color || C.text}
        strokeWidth={s > 30 ? 1.6 : sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

const Btn = ({
  label,
  onPress,
  ghost,
  small,
  disabled,
  icon,
  style
}: {
  label: string;
  onPress: () => void;
  ghost?: boolean;
  small?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: object;
}) => {
  const { C, st } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[st.btn, small && st.btnSm, ghost && st.btnGhost, disabled && { opacity: 0.5 }, style]}
    >
      {icon && <Icon k={icon} s={small ? 14 : 17} color={ghost ? C.accent : '#fff'} sw={1.8} />}
      <Text style={[st.btnT, ghost && { color: C.accent }, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
};

const Chip = ({
  label,
  icon,
  on,
  onPress
}: {
  label: string;
  icon?: string;
  on?: boolean;
  onPress?: () => void;
}) => {
  const { C, st } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        st.chip,
        on
          ? { backgroundColor: C.accent, borderColor: C.accent }
          : { backgroundColor: C.surface, borderColor: C.accentBorder }
      ]}
    >
      {icon && (
        <Icon
          k={icon}
          s={16}
          color={on ? '#ffffff' : C.accent}
          sw={1.8}
        />
      )}
      <Text
        style={[
          st.chipT,
          on ? { color: '#ffffff', fontWeight: '700' } : { color: C.accent, fontWeight: '600' }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const HSerif = ({ children, size = 24, style }: { children: React.ReactNode; size?: number; style?: any }) => {
  const { st } = useTheme();
  return (
    <Text style={[st.serifHeading, { fontSize: size }, style]}>{children}</Text>
  );
};

const Media = ({
  m,
  icon,
  badgeText,
  isPopular,
  h = 145
}: {
  m: string;
  icon: string;
  badgeText?: string;
  isPopular?: boolean;
  h?: number;
}) => {
  const { C, theme } = useTheme();
  const colors = MEDIA[m] || ['#ebe4d8', '#cfc3ae'];
  const gradId = `g_${m}_${icon}`;

  return (
    <View style={{ height: h, width: '100%', position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </SvgGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
      <View style={{ opacity: theme === 'dark' ? 0.3 : 0.22 }}>
        <Icon k={icon} s={52} color={theme === 'dark' ? '#ffffff' : '#141518'} sw={1.3} />
      </View>
      {badgeText ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: theme === 'dark' ? 'rgba(24, 27, 31, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 6,
            borderWidth: theme === 'dark' ? 1 : 0,
            borderColor: 'rgba(255, 255, 255, 0.14)',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '500', color: theme === 'dark' ? '#f2f4f6' : '#16171a' }}>
            {badgeText}
          </Text>
        </View>
      ) : null}
      {isPopular ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: C.accent,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff' }}>Mais procurado</Text>
        </View>
      ) : null}
    </View>
  );
};

/* ---------- UI Centralizada de Placeholder ---------- */
function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  secondaryLabel,
  secondaryIcon,
  onSecondary,
}: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: string;
  onSecondary?: () => void;
}) {
  const { C, st } = useTheme();
  return (
    <View style={st.emptyContainer}>
      <View style={st.emptyCircle}>
        <Icon k={icon} s={42} color={C.accent} sw={1.8} />
      </View>
      <Text style={st.emptyTitle}>{title}</Text>
      <Text style={st.emptySub}>{subtitle}</Text>
      {(actionLabel || secondaryLabel) && (
        <View style={st.emptyActions}>
          {actionLabel && onAction && (
            <Btn
              label={actionLabel}
              icon={actionIcon}
              onPress={onAction}
              style={{ minWidth: 140 }}
            />
          )}
          {secondaryLabel && onSecondary && (
            <Btn
              ghost
              label={secondaryLabel}
              icon={secondaryIcon}
              onPress={onSecondary}
              style={{ minWidth: 130 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

/* ---------- Ghost / Skeleton Loading ---------- */
function Skeleton({
  width,
  height,
  borderRadius = 8,
  style
}: {
  width?: number | `${number}%` | '100%';
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const { C } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: C.skeleton,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

function SkeletonCard() {
  const { st } = useTheme();
  return (
    <View style={[st.card, { gap: 10, padding: 14 }]}>
      <Skeleton height={116} borderRadius={10} />
      <Skeleton width="65%" height={20} />
      <Skeleton width="45%" height={14} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <Skeleton width="35%" height={14} />
        <Skeleton width="32%" height={34} borderRadius={8} />
      </View>
    </View>
  );
}

function SkeletonHome() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Skeleton width="85%" height={38} />
      <Skeleton width="95%" height={18} />
      <Skeleton width="100%" height={46} borderRadius={12} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={110} height={34} borderRadius={99} />
        <Skeleton width={120} height={34} borderRadius={99} />
        <Skeleton width={95} height={34} borderRadius={99} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
    </ScrollView>
  );
}

function SkeletonOrcamento() {
  const { st } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Skeleton width="65%" height={38} borderRadius={8} />
      <Skeleton width="100%" height={46} borderRadius={10} />
      <View style={[st.card, { gap: 12 }]}>
        <Skeleton width="50%" height={20} />
        <Skeleton width="100%" height={48} borderRadius={8} />
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>
    </ScrollView>
  );
}

function SkeletonPedidos() {
  const { st } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="35%" height={24} style={{ marginTop: 8 }} />
      <View style={[st.card, { gap: 8 }]}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="80%" height={14} />
      </View>
    </ScrollView>
  );
}

type Tab = 'home' | 'sup' | 'orc' | 'ped';

/* ---------- Header de Endereço (Estilo Mercado Livre) ---------- */
function AddressBar({ onOpen }: { onOpen: () => void }) {
  const { addresses, addrSel, address } = useStore();
  const { C, st } = useTheme();
  const current = addresses.find(a => a.id === addrSel) || addresses[0];

  return (
    <Pressable onPress={onOpen} style={st.addrBar}>
      <Icon k="pin" s={18} color={C.accent} sw={2} />
      <View style={{ flex: 1 }}>
        <Text style={st.addrBarText} numberOfLines={1}>
          Entregar em: <Text style={{ fontWeight: '700', color: C.text }}>{current ? `${current.label} · ${current.street}, ${current.num} (${current.city}/${current.uf})` : (address?.city ? address.city : 'Escolher endereço de entrega')}</Text>
        </Text>
      </View>
      <Icon k="next" s={14} color={C.muted} />
    </Pressable>
  );
}

/* ---------- Card de Fornecedor ---------- */
function SupplierCard({
  x,
  open,
  onOpenChat
}: {
  x: Supplier;
  open: (n: string) => void;
  onOpenChat: (convId: string) => void;
}) {
  const { filters, sent, startQuote, toast } = useStore();
  const { C, st } = useTheme();
  const cat = catOf(x, filters);
  const isEps = x.s === 'eps' || x.n.includes('Painel Monolítico');

  const handleAction = () => {
    if (sent[x.n]) {
      onOpenChat(sent[x.n]);
    } else {
      const isNew = !sent[x.n];
      const cid = startQuote(x, true);
      if (isNew) {
        toast('Cotação solicitada', `Contato para cotação iniciado com ${x.n}.`);
      }
      onOpenChat(cid);
    }
  };

  return (
    <Pressable
      style={[st.card, { padding: 0, overflow: 'hidden' }]}
      onPress={() => {
        startQuote(x, true);
        open(x.n);
      }}
    >
      <Media m={x.m} icon={cat} badgeText={stageName(cat)} isPopular={isEps} />
      <View style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}>
            <Text style={[st.h4, { fontSize: 15, fontWeight: '600' }]} numberOfLines={1}>{x.n}</Text>
            {/* Check badge de verificado igual ao web */}
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon k="check" s={10} color="#fff" sw={2.4} />
            </View>
          </View>
          {isEps && (
            <View style={{ backgroundColor: 'rgba(23,74,64,.10)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>Destaque</Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: 13, color: C.muted }}>
          {x.c}{x.s !== 'all' ? ' · ' + sysName(x.s) : ''}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon k="star" s={13} color={C.accent} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{rate(x.r)}</Text>
          <Text style={{ fontSize: 13, color: C.muted }}> {x.a} avaliações</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderColor: C.line,
            paddingTop: 10,
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: C.muted }}>{'Responde em até ' + x.t}</Text>
          {sent[x.n] ? (
            <Pressable
              onPress={e => {
                e.stopPropagation();
                handleAction();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.line2,
                backgroundColor: C.surface,
              }}
            >
              <Icon k="msg" s={13} color={C.text} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Abrir conversa</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={e => {
                e.stopPropagation();
                handleAction();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: C.accent,
              }}
            >
              <Icon k="msg" s={13} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Pedir orçamento</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ---------- Telas ---------- */
function Home({
  go,
  open,
  onOpenAddress,
  onOpenObra,
  onOpenProjectAi
}: {
  go: (t: Tab) => void;
  open: (n: string) => void;
  onOpenAddress: () => void;
  onOpenObra: () => void;
  onOpenProjectAi: () => void;
}) {
  const { setFilters } = useStore();
  const { C, st } = useTheme();
  const [city, setCity] = useState('');
  const [area, setArea] = useState('420'), [sys, setSys] = useState('alvenaria'), [std, setStd] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const goTo = (stage: string, sysKey = 'all') => {
    setFilters({ seg: 'svc', stage, sys: sysKey });
    go('sup');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const r = simulate(Math.min(1000, Math.max(80, parseInt(area) || 80)), sys, std);
  void open;

  if (refreshing) {
    return <SkeletonHome />;
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} tintColor={C.accent} />}
    >
      <AddressBar onOpen={onOpenAddress} />

      {/* Hero com tipografia Source Serif 4 */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <Text style={st.heroTitle}>
          Encontre quem constrói{' '}
          <Text style={st.heroAccent}>cada{'\n'}etapa</Text>{' '}
          da sua obra
        </Text>
        <Text style={[st.t2, { fontSize: 15, lineHeight: 22 }]}>Compare sistemas construtivos, receba orçamentos da sua região e acompanhe a obra do projeto à entrega.</Text>
        
        <View style={st.searchBox}>
          <Icon k="search" s={18} color={C.muted} />
          <TextInput style={{ flex: 1, height: 44, fontSize: 14, color: C.text }} placeholder="CEP ou cidade" placeholderTextColor={C.muted} value={city} onChangeText={setCity} />
        </View>
        <Btn label="Buscar fornecedores" onPress={() => { setFilters({ city: city.trim(), stage: 'all', sys: 'all', seg: 'svc' }); go('sup'); }} />

        {/* Categorias mais buscadas com ícones outline */}
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>Mais buscados:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            ['estrutura', 'Painel Monolítico (EPS)', 'eps'],
            ['fundacao', 'Fundação', 'all'],
            ['estrutura', 'Steel frame', 'steel'],
            ['cobertura', 'Telhado', 'all'],
            ['projeto', 'Projeto e aprovação', 'all']
          ].map(([k, n, sys]) => (
            <Chip key={n} label={n} icon={k} onPress={() => goTo(k, sys)} />
          ))}
        </ScrollView>
      </View>

      {/* Banner Analisar Projeto com IA */}
      <Pressable
        style={[st.card, { backgroundColor: C.accent, borderColor: C.accent2, padding: 16 }]}
        onPress={onOpenProjectAi}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon k="doc" s={22} color="#ffffff" sw={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#c9f2e3', textTransform: 'uppercase', letterSpacing: 0.6 }}>★ Recurso com IA</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff', marginTop: 2 }}>Analisar projeto em PDF</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>A IA lê as plantas, gera o checklist e sugere fornecedores para cotar de uma vez.</Text>
          </View>
          <Icon k="next" s={18} color="#ffffff" />
        </View>
      </Pressable>

      {/* Sistemas construtivos */}
      <View style={{ gap: 12 }}>
        <HSerif size={22}>Sistemas construtivos</HSerif>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {SYSTEMS.map(s => (
            <Pressable key={s.k} style={[st.card, { width: 270, padding: 0, overflow: 'hidden' }]} onPress={() => goTo('estrutura', s.k)}>
              <Media m={s.m} icon="estrutura" badgeText={`${s.f} fornecedores`} isPopular={s.k === 'eps'} />
              <View style={{ padding: 14, gap: 4 }}>
                <Text style={st.h4}>{s.n}</Text>
                <Text style={[st.muted, { marginTop: 4, fontSize: 12 }]}>{s.d}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Icon k="check" s={14} color={C.accent} />
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: '700' }}>{s.f} fornecedores na região</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Minha obra */}
      <Pressable style={st.card} onPress={onOpenObra}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={st.eyebrow}>Minha obra</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>Ver detalhes</Text>
            <Icon k="next" s={14} color={C.accent} />
          </View>
        </View>
        <HSerif size={24} style={{ marginTop: 4 }}>Casa térrea</HSerif>
        <Text style={st.muted}>420 m² · Painéis EPS · Atibaia, SP</Text>
        <View style={{ height: 8, backgroundColor: C.s3, borderRadius: 8, marginVertical: 14 }}>
          <View style={{ width: '44%', height: 8, backgroundColor: C.accent, borderRadius: 8 }} />
        </View>
        {[
          ['Sondagem e terraplenagem', '02 set', '#1f7a55', 'terreno'],
          ['Fundação', 'em andamento', C.accent, 'fundacao'],
          ['Vedação e estrutura', 'out', C.s3, 'estrutura'],
          ['Cobertura e telhado', 'nov', C.s3, 'cobertura']
        ].map(([t, d, c, ic]) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
            <Icon k={ic} s={16} color={C.accent} sw={1.8} />
            <Text style={{ flex: 1, color: C.text, fontSize: 13, fontWeight: '500' }}>{t}</Text>
            <Text style={st.muted}>{d}</Text>
          </View>
        ))}
        <Btn small label="Contratar estrutura" onPress={() => goTo('estrutura')} style={{ marginTop: 12 }} />
      </Pressable>

      {/* Etapas da obra com ícones outline */}
      <View style={{ gap: 12 }}>
        <HSerif size={22}>Etapas da obra</HSerif>
        <Text style={[st.muted, { marginTop: -6 }]}>Uma obra são 10 contratações na sequência certa</Text>
        {STAGES.map((s, i) => (
          <Pressable key={s[0]} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }]} onPress={() => goTo(s[0])}>
            <View style={st.stageIconBox}>
              <Icon k={s[0]} s={22} color={C.accent} sw={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.h4}>{String(i + 1).padStart(2, '0')}. {s[1]}</Text>
              <Text style={st.muted}>{STAGE_COUNT[s[0]]} fornecedores na região</Text>
            </View>
            <Icon k="next" s={16} color={C.muted} />
          </Pressable>
        ))}
      </View>

      {/* Simulador (mesmas cores do web) */}
      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, overflow: 'hidden' }}>
        <View style={{ padding: 20, gap: 12 }}>
          <Text style={st.eyebrow}>Simulador</Text>
          <Text style={[st.heroTitle, { fontSize: 32, lineHeight: 38 }]}>
            Quanto custa <Text style={st.heroAccent}>e quanto demora</Text> a sua obra
          </Text>
          <Text style={[st.t2, { fontSize: 14, lineHeight: 21 }]}>
            Mude a área, o sistema e o padrão de acabamento para comparar cenários antes de pedir orçamento.
          </Text>
        </View>

        <View style={{ padding: 20, gap: 16, backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.line }}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.t2 }}>Área construída</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{Math.min(1000, Math.max(80, parseInt(area) || 80))} m²</Text>
            </View>
            <TextInput keyboardType="numeric" value={area} onChangeText={setArea} style={st.input} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.t2 }}>Sistema construtivo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SYSTEMS.map(s => <Chip key={s.k} label={s.n} on={sys === s.k} onPress={() => setSys(s.k)} />)}
            </ScrollView>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.t2 }}>Padrão de acabamento</Text>
            <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line }}>
              {STANDARDS.map((n, i) => (
                <Pressable
                  key={n}
                  onPress={() => setStd(i)}
                  style={{ flex: 1, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: std === i ? C.s3 : 'transparent' }}
                >
                  <Text numberOfLines={1} style={{ color: std === i ? C.text : C.t2, fontWeight: '600', fontSize: 12 }}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 4 }}>
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>Custo estimado</Text>
                <Text style={st.monoValLarge}>{r.cost}</Text>
              </View>
              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 4 }}>
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>Valor por m²</Text>
                <Text style={st.monoValLarge}>{r.m2}</Text>
              </View>
            </View>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 4 }}>
              <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>Prazo estimado</Text>
              <Text style={st.monoValLarge}>{r.time}</Text>
            </View>
          </View>
          <Text style={{ color: C.muted, fontSize: 11 }}>Valores de referência do protótipo baseados no CUB.</Text>
        </View>
      </View>

      {/* Projetos prontos (desativado / lançamento futuro) */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <HSerif size={22}>Projetos prontos</HSerif>
            <View style={{ backgroundColor: C.accentSubtle, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: C.accent }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Em breve</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>Lançamento futuro</Text>
        </View>
        <Text style={[st.muted, { marginTop: -6, fontSize: 13, lineHeight: 18 }]}>
          Plantas completas com projetos complementares prontos para construir. Recurso em desenvolvimento para lançamento futuro.
        </Text>
        {PLANS.map(p => (
          <View key={p.n} style={[st.card, { opacity: 0.88 }]}>
            <View style={{ backgroundColor: C.s2, borderRadius: 10, padding: 8, height: 140, position: 'relative' }}>
              <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, backgroundColor: 'rgba(20,28,24,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>Em breve</Text>
              </View>
              <View style={{ flex: 1 }}>
                {p.rooms.map(([x, y, w, h, l]) => (
                  <View key={l + x + y} style={{ position: 'absolute', left: `${(x / 70) * 100}%`, top: `${(y / 60) * 100}%`, width: `${(w / 70) * 100}%`, height: `${(h / 60) * 100}%`, borderWidth: 0.8, borderColor: C.t2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 8, color: C.t2, textAlign: 'center' }}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={st.h4}>{p.n}</Text>
              <View style={{ backgroundColor: C.s3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>Lançamento futuro</Text>
              </View>
            </View>
            <Text style={st.muted}>{p.a} m² · {p.q} quartos · {p.b} banheiros · {p.s}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Suppliers({
  open,
  onOpenAddress,
  onOpenChat
}: {
  open: (n: string) => void;
  onOpenAddress: () => void;
  onOpenChat: (convId: string) => void;
}) {
  const { filters, setFilters } = useStore();
  const { C, st } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const list = filterSuppliers(filters);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} tintColor={C.accent} />}
    >
      <AddressBar onOpen={onOpenAddress} />

      <HSerif size={28}>Fornecedores</HSerif>
      <Text style={st.muted}>{filterSummary(filters, list.length)}</Text>

      {/* Linha de serviços e etapas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip
          label="Todas as etapas"
          on={filters.stage === 'all'}
          onPress={() => setFilters({ stage: 'all' })}
        />
        {STAGES.map(([k, n]) => (
          <Chip
            key={k}
            label={n}
            icon={k}
            on={filters.stage === k}
            onPress={() => setFilters({ stage: k })}
          />
        ))}
      </ScrollView>

      <TextInput
        style={st.input}
        placeholder="Filtrar por cidade"
        placeholderTextColor={C.muted}
        value={filters.city}
        onChangeText={t => setFilters({ city: t })}
      />

      {loading || refreshing ? (
        <View style={{ gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nenhum fornecedor encontrado"
          subtitle="Tente limpar o filtro de sistema construtivo ou buscar por outra cidade da região."
          actionLabel="Limpar filtros"
          actionIcon="x"
          onAction={() => setFilters({ stage: 'all', sys: 'all', city: '' })}
        />
      ) : (
        list.map(x => <SupplierCard key={x.n} x={x} open={open} onOpenChat={onOpenChat} />)
      )}
    </ScrollView>
  );
}

/* ---------- Tela de Orçamento ---------- */
function Orcamento({
  goSup,
  onOpenAddress,
  onOpenCheckout
}: {
  goSup: () => void;
  onOpenAddress: () => void;
  onOpenCheckout: () => void;
}) {
  const { orcName, setOrcName, setQty, removeItem, addresses, addrSel, address, requireAuth } = useStore();
  const { items, groups, totals } = useOrc();
  const { C, st } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const currentAddr = addresses.find(a => a.id === addrSel) || addresses[0];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (!items.length) {
    return (
      <EmptyState
        icon="orc"
        title="Seu orçamento está vazio"
        subtitle="Adicione serviços com preço nos perfis dos fornecedores para cotar e contratar etapas da sua obra."
        actionLabel="Ver serviços"
        actionIcon="helmet"
        onAction={() => { useStore.getState().setFilters({ seg: 'svc', stage: 'all' }); goSup(); }}
      />
    );
  }

  if (refreshing) {
    return <SkeletonOrcamento />;
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} tintColor={C.accent} />}
    >
      <TextInput style={[st.input, { fontWeight: '600' }]} value={orcName} onChangeText={setOrcName} />
      
      {/* Linha de endereço */}
      <Pressable onPress={onOpenAddress} style={st.addrLine}>
        <Icon k="pin" s={20} color={C.accent} sw={2} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: C.text, fontSize: 14 }}>
            Entregar em: {currentAddr ? currentAddr.label : (address?.city || 'Selecionar')}
          </Text>
          <Text style={st.muted}>
            {currentAddr ? `${currentAddr.street}, ${currentAddr.num} · ${currentAddr.city}/${currentAddr.uf}` : 'Cadastre ou troque o endereço de entrega'}
          </Text>
        </View>
        <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>Trocar</Text>
      </Pressable>

      {groups.map(g => (
        <View key={g.sup} style={[st.card, !g.ok && { borderColor: C.warn }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={st.h4}>{g.sup}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon k={g.x.e} s={14} color={C.accent} sw={1.8} />
              <Text style={{ fontSize: 12, color: C.muted }}>{stageName(g.x.e)}</Text>
            </View>
          </View>
          <Text style={st.muted}>{g.x.c}</Text>
          {!g.ok && <Text style={{ color: C.warn, fontWeight: '600', marginTop: 4 }}>Não entrega neste endereço</Text>}
          {g.items.map(i => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderColor: C.line, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '500' }}>{i.n}</Text>
                <Text style={st.muted}>{BRLc(i.p)} / {i.un}</Text>
              </View>
              <View style={st.qty}>
                <Pressable onPress={() => setQty(i.id, i.qty - 1)} style={st.qBtn}><Text style={{ fontSize: 16, fontWeight: '600', color: C.text }}>−</Text></Pressable>
                <Text style={{ fontWeight: '600', minWidth: 26, textAlign: 'center', color: C.text }}>{i.qty}</Text>
                <Pressable onPress={() => setQty(i.id, i.qty + 1)} style={st.qBtn}><Text style={{ fontSize: 16, fontWeight: '600', color: C.text }}>+</Text></Pressable>
              </View>
              <Pressable onPress={() => removeItem(i.id)} hitSlop={8}>
                <Icon k="x" s={16} color={C.muted} />
              </Pressable>
            </View>
          ))}
          <Text style={[st.muted, { marginTop: 6 }]}>
            Contratação de etapas · Total <Text style={{ fontWeight: '700', color: C.text }}>{BRLc(g.total)}</Text>
          </Text>
        </View>
      ))}

      <View style={st.card}>
        {[
          ['Serviços e Etapas', totals.svc]
        ].map(([l, v]) => (
          <View key={l as string} style={st.row}>
            <Text style={st.t2}>{l}</Text>
            <Text style={{ fontWeight: '600', color: C.text }}>{BRLc(v as number)}</Text>
          </View>
        ))}
        <View style={[st.row, { borderTopWidth: 1, borderColor: C.line, paddingTop: 10, marginTop: 6 }]}>
          <Text style={st.h4}>Total do orçamento</Text>
          <Text style={[st.h4, { color: C.accent }]}>{BRLc(totals.total)}</Text>
        </View>
      </View>
      <Btn label="Contratar etapas" disabled={!groups.some(g => g.ok)} onPress={() => requireAuth(onOpenCheckout)} />
    </ScrollView>
  );
}

function Pedidos({
  go,
  onOpenAddress,
  onOpenObra,
  onOpenMessages,
  onOpenQuotes,
  onOpenOrder,
  onOpenQuote,
  onOpenProfile,
  onOpenProjectAi
}: {
  go: (t: Tab) => void;
  onOpenAddress: () => void;
  onOpenObra: () => void;
  onOpenMessages: () => void;
  onOpenQuotes: () => void;
  onOpenOrder: (orderId: string) => void;
  onOpenQuote: (quoteId: string) => void;
  onOpenProfile: () => void;
  onOpenProjectAi: () => void;
}) {
  const { quotes, orders, user, signOut, openAuth } = useStore();
  const { C, st, theme, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (refreshing) {
    return <SkeletonPedidos />;
  }

  const hasContent = quotes.length > 0 || orders.length > 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} tintColor={C.accent} />}
    >
      {user ? (
        <View style={[st.card, { gap: 12, padding: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ position: 'relative' }}>
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: C.accent }}
                />
              ) : (
                <View style={[st.avatar, { width: 56, height: 56, borderRadius: 28 }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>{initials(user.name)}</Text>
                </View>
              )}
              <Pressable
                onPress={async () => {
                  try {
                    const res = await DocumentPicker.getDocumentAsync({
                      type: ['image/*'],
                      copyToCacheDirectory: true,
                      multiple: false
                    });
                    if (!res.canceled && res.assets && res.assets.length > 0) {
                      useStore.getState().updateUser({ avatar: res.assets[0].uri });
                      useStore.getState().toast('Foto de perfil atualizada!');
                    }
                  } catch (e) {}
                }}
                style={{
                  position: 'absolute', bottom: -2, right: -2, width: 22, height: 22,
                  borderRadius: 11, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.surface,
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icon k="camera" s={11} color="#fff" />
              </Pressable>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={st.h4} numberOfLines={1}>{user.name}</Text>
                <View style={[st.pill, { paddingHorizontal: 6, paddingVertical: 1, backgroundColor: C.accentSubtle }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent }}>
                    {user.role === 'supplier' ? 'Fornecedor' : 'Proprietário'}
                  </Text>
                </View>
              </View>
              <Text style={[st.muted, { fontSize: 12 }]} numberOfLines={1}>{user.email}</Text>
              <Text style={{ fontSize: 11, color: C.t2 }}>
                {user.city ? `${user.city}/${user.uf || 'SP'}` : 'Atibaia/SP'} · {user.phone || '(11) 98765-4321'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, borderTopWidth: 1, borderColor: C.line, paddingTop: 10 }}>
            <Btn
              small
              label="Editar cadastro completo"
              icon="user"
              onPress={onOpenProfile}
              style={{ flex: 1 }}
            />
            <Btn
              small
              ghost
              label="Sair"
              onPress={signOut}
              style={{ minWidth: 70 }}
            />
          </View>
        </View>
      ) : (
        <Btn label="Entrar ou criar conta" onPress={openAuth} />
      )}

      {/* Acesso rápido às áreas da obra */}
      <Text style={st.secLabel}>Minha Construção</Text>
      
      <Pressable onPress={onOpenObra} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={st.stageIconBox}>
          <Icon k="helmet" s={20} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.h4}>Minha obra</Text>
          <Text style={st.muted}>Casa térrea Atibaia · 420 m² (44% concluído)</Text>
        </View>
        <Icon k="next" s={16} color={C.muted} />
      </Pressable>

      <Pressable onPress={onOpenMessages} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={st.stageIconBox}>
          <Icon k="msg" s={20} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.h4}>Mensagens e negociações</Text>
          <Text style={st.muted}>Chat protegido com fornecedores e propostas</Text>
        </View>
        <Icon k="next" s={16} color={C.muted} />
      </Pressable>

      <Pressable onPress={onOpenQuotes} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={st.stageIconBox}>
          <Icon k="orc" s={20} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.h4}>Cotações enviadas</Text>
          <Text style={st.muted}>{quotes.length} cotações em análise</Text>
        </View>
        <Icon k="next" s={16} color={C.muted} />
      </Pressable>

      <Pressable onPress={onOpenAddress} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={st.stageIconBox}>
          <Icon k="pin" s={20} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.h4}>Endereços de entrega</Text>
          <Text style={st.muted}>Gerenciar múltiplos endereços e locais da obra</Text>
        </View>
        <Icon k="next" s={16} color={C.muted} />
      </Pressable>

      {/* ========================================================
          CONFIGURAÇÕES DO APLICATIVO COM SWITCH DE TEMA ESCURO
          ======================================================== */}
      <HSerif size={22}>Configurações</HSerif>
      <View style={[st.card, { gap: 14 }]}>
        {/* Switch de Tema Escuro */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 }}>
            <View style={st.stageIconBox}>
              <Icon k={theme === 'dark' ? 'moon' : 'sun'} s={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.h4}>Tema escuro</Text>
              <Text style={st.muted}>Alternar entre modo claro e escuro</Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: C.s3, true: C.accent }}
            thumbColor={Platform.OS === 'android' ? (theme === 'dark' ? '#fff' : '#f4f3f0') : undefined}
          />
        </View>

        {/* Switch de Notificações */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: C.line, paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 }}>
            <View style={st.stageIconBox}>
              <Icon k="bell" s={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.h4}>Notificações da obra</Text>
              <Text style={st.muted}>Avisos de cotações, orçamentos e chat</Text>
            </View>
          </View>
          <Switch
            value={notifsEnabled}
            onValueChange={setNotifsEnabled}
            trackColor={{ false: C.s3, true: C.accent }}
            thumbColor={Platform.OS === 'android' ? (notifsEnabled ? '#fff' : '#f4f3f0') : undefined}
          />
        </View>
      </View>

      {/* Atalho IA OFIR */}
      <Pressable
        style={[st.card, { backgroundColor: C.accentSubtle, borderColor: C.accentBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
        onPress={onOpenProjectAi}
      >
        <View style={[st.stageIconBox, { backgroundColor: C.surface }]}>
          <Icon k="doc" s={20} color={C.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[st.h4, { color: C.accent }]}>Análise de projeto com IA</Text>
          <Text style={st.muted}>Checklist por etapa e envio de cotações em lote</Text>
        </View>
        <Icon k="next" s={16} color={C.accent} />
      </Pressable>

      <HSerif size={22}>Cotações</HSerif>
      {quotes.length === 0 ? (
        <View style={[st.card, { alignItems: 'center', padding: 24, gap: 8 }]}>
          <View style={[st.emptyCircle, { width: 54, height: 54, marginBottom: 4 }]}>
            <Icon k="orc" s={26} color={C.accent} sw={1.8} />
          </View>
          <Text style={st.h4}>Nenhuma cotação ainda</Text>
          <Text style={[st.muted, { textAlign: 'center', fontSize: 13 }]}>Peça cotações a vários fornecedores simultaneamente.</Text>
        </View>
      ) : (
        quotes.map(q => (
          <Pressable
            key={q.id}
            onPress={() => onOpenQuote(q.id)}
            style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
          >
            <View style={st.stageIconBox}>
              <Icon k="orc" s={20} color={C.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.h4}>{q.id} · {q.label}</Text>
              <Text style={st.muted}>{q.sups?.join(', ') || ''} · {q.created}</Text>
              <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>{q.status || 'Em análise'}</Text>
            </View>
            <Icon k="next" s={16} color={C.muted} />
          </Pressable>
        ))
      )}

      <HSerif size={22}>Pedidos</HSerif>
      {orders.length === 0 ? (
        <View style={[st.card, { alignItems: 'center', padding: 24, gap: 8 }]}>
          <View style={[st.emptyCircle, { width: 54, height: 54, marginBottom: 4 }]}>
            <Icon k="doc" s={26} color={C.accent} sw={1.8} />
          </View>
          <Text style={st.h4}>Nenhum pedido finalizado</Text>
          <Text style={[st.muted, { textAlign: 'center', fontSize: 13 }]}>Seus pedidos fechados pela plataforma aparecerão aqui com custódia protegida.</Text>
        </View>
      ) : (
        orders.map(o => (
          <Pressable
            key={o.id}
            onPress={() => onOpenOrder(o.id)}
            style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
          >
            <View style={st.stageIconBox}>
              <Icon k="doc" s={20} color={C.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.h4}>{o.id} · {o.sup}</Text>
              <Text style={st.muted}>{o.created} · {o.method.toUpperCase()} · Taxa OFIR {BRLc(o.fee)}</Text>
              <Text style={{ fontWeight: '700', color: C.text, marginTop: 2 }}>{BRLc(o.total)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[st.pill, o.done && st.pillOk]}>
                <Text style={[st.pillText, o.done && st.pillTextOk]}>{o.status}</Text>
              </View>
              <Icon k="next" s={16} color={C.muted} />
            </View>
          </Pressable>
        ))
      )}

      {!hasContent && (
        <Btn ghost label="Explorar fornecedores" icon="search" onPress={() => go('sup')} style={{ marginTop: 8 }} />
      )}

      {/* Rodapé institucional OFIR */}
      <View style={{ alignItems: 'center', paddingVertical: 26, gap: 6, marginTop: 10 }}>
        <View style={st.logo}>
          <View style={st.logoBox}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path fillRule="evenodd" clipRule="evenodd" d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2ZM12 6.5L7.5 9.1V14.9L12 17.5L16.5 14.9V9.1L12 6.5Z" fill="#ffffff" />
              <Circle cx={12} cy={12} r={1.8} fill="#10b981" />
            </Svg>
          </View>
          <Text style={st.logoText}>OFIR</Text>
        </View>
        <Text style={{ fontSize: 12, color: C.muted }}>Plataforma Inteligente de Construção</Text>
      </View>
    </ScrollView>
  );
}

/* =========================================================================
   MODAL DE GERENCIAMENTO DE ENDEREÇOS (MERCADO LIVRE COM VIACEP & GPS)
   ========================================================================= */
function AddressManagerModal({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { addresses, addrSel, selectAddress, addAddress, updateAddress, deleteAddress } = useStore();
  const { C, st } = useTheme();
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // Form fields
  const [label, setLabel] = useState('Obra');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [comp, setComp] = useState('');
  const [hood, setHood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('SP');
  const [cepLoading, setCepLoading] = useState(false);
  const [err, setErr] = useState('');

  const openNew = () => {
    setEditingAddr(null);
    setLabel('Obra');
    setCep('');
    setStreet('');
    setNum('');
    setComp('');
    setHood('');
    setCity('');
    setUf('SP');
    setErr('');
    setIsFormOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingAddr(a);
    setLabel(a.label);
    setCep(a.cep);
    setStreet(a.street);
    setNum(a.num);
    setComp(a.comp || '');
    setHood(a.hood || '');
    setCity(a.city);
    setUf(a.uf);
    setErr('');
    setIsFormOpen(true);
  };

  const handleCepChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 8);
    const masked = clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
    setCep(masked);
    if (clean.length === 8) {
      setCepLoading(true);
      setErr('');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (data.erro) {
          setErr('CEP não encontrado. Preencha manualmente.');
        } else {
          setStreet(data.logradouro || '');
          setHood(data.bairro || '');
          setCity(data.localidade || '');
          setUf(data.uf || 'SP');
        }
      } catch (e) {
        setErr('Não foi possível consultar o CEP.');
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    setLocLoading(true);
    setTimeout(() => {
      setLocLoading(false);
      setEditingAddr(null);
      setLabel('Localização atual (Obra)');
      setCep('12940-000');
      setStreet('Alameda das Araucárias');
      setNum('350');
      setComp('Loteamento Reserva');
      setHood('Jardim dos Pinheiros');
      setCity('Atibaia');
      setUf('SP');
      setIsFormOpen(true);
      Alert.alert('Localização encontrada', 'Preenchemos os dados com base na sua localização atual. Confira o número e salve.');
    }, 900);
  };

  const handleSave = () => {
    if (!cep.trim() || !street.trim() || !city.trim() || !num.trim()) {
      return setErr('Preencha CEP, Rua, Número e Cidade.');
    }
    if (editingAddr) {
      updateAddress({
        id: editingAddr.id,
        label: label.trim() || 'Obra',
        cep: cep.trim(),
        street: street.trim(),
        num: num.trim(),
        comp: comp.trim(),
        hood: hood.trim(),
        city: city.trim(),
        uf: uf.trim().toUpperCase()
      });
    } else {
      addAddress({
        label: label.trim() || 'Obra',
        cep: cep.trim(),
        street: street.trim(),
        num: num.trim(),
        comp: comp.trim(),
        hood: hood.trim(),
        city: city.trim(),
        uf: uf.trim().toUpperCase()
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Excluir endereço', `Deseja remover o endereço "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteAddress(id) }
    ]);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Text style={[st.h4, { flex: 1, fontSize: 17 }]}>
            {isFormOpen ? (editingAddr ? 'Editar endereço' : 'Novo endereço de entrega') : 'Endereços de entrega'}
          </Text>
          <Pressable onPress={() => isFormOpen ? setIsFormOpen(false) : onClose()} hitSlop={8}>
            <Icon k="x" s={22} color={C.text} />
          </Pressable>
        </View>

        {isFormOpen ? (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Identificação do endereço</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Obra', 'Casa', 'Depósito', 'Escritório'].map(l => (
                <Pressable
                  key={l}
                  onPress={() => setLabel(l)}
                  style={[st.chip, label === l && { backgroundColor: C.accent, borderColor: C.accent }]}
                >
                  <Text style={[st.chipT, label === l && { color: '#fff' }]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ position: 'relative' }}>
              <TextInput
                style={[st.input, cepLoading && { paddingRight: 40 }]}
                placeholder="CEP (ex: 12940-000)"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                maxLength={9}
                value={cep}
                onChangeText={handleCepChange}
              />
              {cepLoading && (
                <View style={{ position: 'absolute', right: 12, top: 13 }}>
                  <ActivityIndicator size="small" color={C.accent} />
                </View>
              )}
            </View>

            <TextInput
              style={st.input}
              placeholder="Rua / Avenida"
              placeholderTextColor={C.muted}
              value={street}
              onChangeText={setStreet}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[st.input, { flex: 1 }]}
                placeholder="Número"
                placeholderTextColor={C.muted}
                value={num}
                onChangeText={setNum}
              />
              <TextInput
                style={[st.input, { flex: 2 }]}
                placeholder="Complemento (Lote, Quadra)"
                placeholderTextColor={C.muted}
                value={comp}
                onChangeText={setComp}
              />
            </View>

            <TextInput
              style={st.input}
              placeholder="Bairro"
              placeholderTextColor={C.muted}
              value={hood}
              onChangeText={setHood}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[st.input, { flex: 3 }]}
                placeholder="Cidade"
                placeholderTextColor={C.muted}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[st.input, { flex: 1, textTransform: 'uppercase' }]}
                placeholder="UF"
                placeholderTextColor={C.muted}
                maxLength={2}
                value={uf}
                onChangeText={setUf}
              />
            </View>

            {!!err && <Text style={{ color: C.warn, fontSize: 13 }}>{err}</Text>}

            <Btn label="Salvar endereço" icon="check" onPress={handleSave} style={{ marginTop: 12 }} />
            <Btn ghost label="Cancelar" onPress={() => setIsFormOpen(false)} />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {/* Botão de localização por GPS */}
            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={locLoading}
              style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: C.accent, backgroundColor: C.accentSubtle }]}
            >
              <View style={[st.stageIconBox, { backgroundColor: C.surface }]}>
                {locLoading ? <ActivityIndicator size="small" color={C.accent} /> : <Icon k="pin" s={20} color={C.accent} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.h4, { color: C.accent }]}>Usar minha localização atual</Text>
                <Text style={st.muted}>Detecta a rua e o CEP da obra automaticamente</Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Endereços cadastrados ({addresses.length})
              </Text>
              <Pressable onPress={openNew} hitSlop={8}>
                <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14 }}>+ Novo endereço</Text>
              </Pressable>
            </View>

            {addresses.map(a => {
              const isSelected = addrSel === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => selectAddress(a.id)}
                  style={[st.card, isSelected && { borderColor: C.accent, borderWidth: 2 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={[st.radioCircle, isSelected && { borderColor: C.accent }]}>
                      {isSelected && <View style={st.radioDot} />}
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[st.h4, isSelected && { color: C.accent }]}>{a.label}</Text>
                        {isSelected && (
                          <View style={st.activeBadge}>
                            <Text style={st.activeBadgeText}>Selecionado</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: C.text, fontSize: 14, fontWeight: '500' }}>
                        {a.street}, {a.num}{a.comp ? ` (${a.comp})` : ''}
                      </Text>
                      <Text style={st.muted}>
                        {a.hood ? `${a.hood} · ` : ''}{a.city}/{a.uf} · CEP {a.cep}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: C.line }}>
                    <Pressable onPress={() => openEdit(a)} hitSlop={8}>
                      <Text style={{ color: C.accent, fontWeight: '600', fontSize: 13 }}>Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(a.id, a.label)} hitSlop={8}>
                      <Text style={{ color: C.warn, fontWeight: '600', fontSize: 13 }}>Excluir</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <Btn label="Cadastrar novo endereço" icon="pin" onPress={openNew} style={{ marginTop: 8 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   PÁGINA INTERNA DO FORNECEDOR (RÉPLICA DO DESKTOP & AIRBNB STYLE)
   ========================================================================= */
function SupplierProfileModal({
  name,
  onClose,
  onOpenChat
}: {
  name: string;
  onClose: () => void;
  onOpenChat?: (convId: string) => void;
}) {
  const x = SUPPLIERS.find(s => s.n === name);
  if (!x) return null;

  const det = getSupplierDetails(x);
  const { addItem, requireAuth, requestQuote, sent } = useStore();
  const { C, st } = useTheme();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  const handleAddSvc = (s: { n: string; un?: string; p?: number }) => {
    addItem({ kind: 'svc', sup: x.n, n: s.n, un: s.un || 'serviço', p: s.p || 0, qty: 1 });
    setToastMsg(`+ Serviço "${s.n}" adicionado ao orçamento!`);
    setTimeout(() => setToastMsg(''), 2200);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{x.n}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Slide de fotos estilo Airbnb */}
          <View style={{ position: 'relative' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActivePhotoIdx(idx);
              }}
            >
              {det.photos.map((ph, idx) => (
                <View key={ph.t + idx} style={{ width: SCREEN_WIDTH, height: 250 }}>
                  <Media m={ph.m} icon={x.e} h={250} />
                  <View style={st.photoCaptionBox}>
                    <Text style={st.photoCaptionTitle}>{ph.t}</Text>
                    <Text style={st.photoCaptionSub}>{ph.c} · {ph.y}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={st.photoCounter}>
              <Text style={st.photoCounterText}>{activePhotoIdx + 1} / {det.photos.length}</Text>
            </View>
          </View>

          <View style={{ padding: 18, gap: 16 }}>
            {/* Título e selo verificado com Source Serif 4 */}
            <View style={{ gap: 6 }}>
              <HSerif size={28}>{x.n}</HSerif>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon k="check" s={16} color={C.accent} />
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: '700' }}>Fornecedor Verificado</Text>
                </View>
                <Text style={st.muted}>·</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>★ {rate(x.r)} ({x.a})</Text>
                <Text style={st.muted}>·</Text>
                <Text style={st.muted}>{x.c}</Text>
              </View>
            </View>

            {/* Destaques numéricos */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[st.card, { flex: 1, padding: 12, alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{det.anos} anos</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>de experiência</Text>
              </View>
              <View style={[st.card, { flex: 1, padding: 12, alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{det.obras} obras</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>concluídas</Text>
              </View>
              <View style={[st.card, { flex: 1, padding: 12, alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{x.t || '1h'}</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>resposta</Text>
              </View>
            </View>

            {/* Destaques e prêmios (Awards) */}
            <View style={{ gap: 8 }}>
              {det.awards.map((aw, i) => (
                <View key={aw.t + i} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }]}>
                  <View style={st.stageIconBox}>
                    <Icon k={aw.ic} s={20} color={C.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: C.text }}>{aw.t}</Text>
                    <Text style={[st.muted, { fontSize: 12 }]}>{aw.s}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Sobre o especialista e Responsável Técnico */}
            <View style={[st.card, { gap: 10 }]}>
              <HSerif size={20}>Sobre o especialista</HSerif>
              <Text style={{ fontSize: 14, color: C.t2, lineHeight: 22 }}>{det.desc}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: C.line }}>
                <View style={st.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(det.resp)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: C.text }}>{det.resp}</Text>
                  <Text style={st.muted}>{det.reg}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: C.muted, marginTop: 6 }}>
                Especialidades:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {det.spec.map(s => (
                  <Chip key={s} label={s} />
                ))}
              </View>
            </View>

            {/* Catálogo de serviços com preços */}
            <View style={{ gap: 12 }}>
              <HSerif size={22}>Serviços e mão de obra</HSerif>
              {det.svcs.map(s => (
                <View key={s.n} style={[st.card, { gap: 10 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontWeight: '700', fontSize: 15, color: C.text }}>{s.n}</Text>
                      <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{s.d}</Text>
                    </View>
                    {s.p ? (
                      <Text style={{ fontWeight: '800', color: C.accent, fontSize: 15 }}>
                        {BRLc(s.p)} {s.u && <Text style={{ fontSize: 11, color: C.muted }}>/{s.u}</Text>}
                      </Text>
                    ) : (
                      <Text style={{ fontWeight: '600', color: C.muted, fontSize: 13 }}>Sob consulta</Text>
                    )}
                  </View>
                  {s.days && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon k="clock" s={13} color={C.muted} />
                      <Text style={{ fontSize: 12, color: C.muted }}>Prazo estimado: até {s.days} dias</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, borderTopWidth: 1, borderColor: C.line, paddingTop: 10 }}>
                    {s.p ? (
                      <>
                        <Pressable
                          onPress={() => handleAddSvc({ n: s.n, un: s.u, p: s.p })}
                          style={[st.btn, st.btnSm, st.btnGhost, { flex: 1, paddingHorizontal: 8 }]}
                        >
                          <Icon k="orc" s={14} color={C.accent} />
                          <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>Orçar etapa</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            const cid = useStore.getState().startQuote(x, false);
                            onClose();
                            onOpenChat?.(cid);
                          }}
                          style={[st.btn, st.btnSm, { flex: 1, paddingHorizontal: 8 }]}
                        >
                          <Icon k="check" s={14} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Contratar</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        onPress={() => {
                          const cid = useStore.getState().startQuote(x, true);
                          onClose();
                          onOpenChat?.(cid);
                        }}
                        style={[st.btn, st.btnSm, st.btnGhost, { flex: 1 }]}
                      >
                        <Icon k="msg" s={14} color={C.accent} />
                        <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>Pedir orçamento sob medida</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Cidades atendidas */}
            <View style={[st.card, { gap: 10 }]}>
              <HSerif size={20}>Cidades atendidas</HSerif>
              <Text style={st.muted}>Entrega e executa obras nos seguintes municípios:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {x.atende.map(c => (
                  <View key={c} style={[st.chip, { backgroundColor: C.s2, borderColor: 'transparent' }]}>
                    <Text style={{ fontSize: 12, color: C.t2 }}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Avaliações reais dos clientes estilo Airbnb */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <HSerif size={22}>Avaliações</HSerif>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>★ {rate(x.r)} · {x.a} avaliações</Text>
              </View>

              <View style={[st.card, { gap: 10 }]}>
                {det.bars.map(([label, score]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ width: 120, fontSize: 13, color: C.t2 }}>{label}</Text>
                    <View style={{ flex: 1, height: 6, backgroundColor: C.s3, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${(score / 5) * 100}%`, height: '100%', backgroundColor: C.accent }} />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text, width: 28, textAlign: 'right' }}>{score.toFixed(1)}</Text>
                  </View>
                ))}
              </View>

              {det.reviews.map((rv, idx) => (
                <View key={rv.n + idx} style={[st.card, { gap: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[st.avatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: C.s3 }]}>
                      <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{initials(rv.n)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: C.text }}>{rv.n}</Text>
                      <Text style={{ fontSize: 11, color: C.muted }}>{rv.o} · {rv.d}</Text>
                    </View>
                    <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>{'★'.repeat(rv.r)}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: C.t2, lineHeight: 19 }}>"{rv.txt}"</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {!!toastMsg && (
          <View style={st.profileToast}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{toastMsg}</Text>
          </View>
        )}

        <View style={st.bottomBarAirbnb}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: C.muted }}>Atendimento garantido</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>★ {rate(x.r)} ({x.a} reviews)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onOpenChat && (
              <Pressable
                onPress={() => {
                  const cid = useStore.getState().startQuote(x, false);
                  onClose();
                  onOpenChat(cid);
                }}
                style={[st.stageIconBox, { width: 44, height: 44, borderRadius: 10 }]}
              >
                <Icon k="msg" s={20} color={C.accent} />
              </Pressable>
            )}
            <View style={{ width: 145 }}>
              {sent[x.n] ? (
                <Btn
                  label="Abrir conversa"
                  icon="msg"
                  onPress={() => {
                    onClose();
                    onOpenChat?.(sent[x.n]);
                  }}
                />
              ) : (
                <Btn
                  label="Pedir orçamento"
                  icon="orc"
                  onPress={() => {
                    const cid = useStore.getState().startQuote(x, true);
                    useStore.getState().toast('Cotação solicitada', `Contato para cotação iniciado com ${x.n}.`);
                    onClose();
                    onOpenChat?.(cid);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE AUTENTICAÇÃO COM EYE PASSWORD & SOCIAL LOGIN
   ========================================================================= */
function Auth() {
  const { closeAuth, signIn } = useStore();
  const { C, st } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'owner' | 'supplier'>('owner');
  const [f, setF] = useState({ name: '', email: '', pass: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return setErr('Informe um e-mail válido.');
    if (f.pass.length < (mode === 'signup' ? 8 : 1)) return setErr(mode === 'signup' ? 'A senha precisa de 8 caracteres.' : 'Informe a senha.');
    if (mode === 'signup' && !f.name.trim()) return setErr('Informe seu nome.');
    signIn({ name: f.name.trim() || f.email.split('@')[0], email: f.email, role });
  };

  return (
    <Modal animationType="slide" transparent onRequestClose={closeAuth}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={st.logo}>
              <View style={st.logoBox}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path fillRule="evenodd" clipRule="evenodd" d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2ZM12 6.5L7.5 9.1V14.9L12 17.5L16.5 14.9V9.1L12 6.5Z" fill="#ffffff" />
                  <Circle cx={12} cy={12} r={1.8} fill="#10b981" />
                </Svg>
              </View>
              <Text style={st.logoText}>OFIR</Text>
            </View>
            <Pressable onPress={closeAuth} hitSlop={8}><Icon k="x" /></Pressable>
          </View>
          <HSerif size={24}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</HSerif>

          {Platform.OS === 'ios' ? (
            <Pressable
              style={st.appleBtn}
              onPress={() => signIn({ name: 'Eduardo Castro', email: 'eduardo@icloud.com', role })}
            >
              <Icon k="apple" s={18} color="#fff" />
              <Text style={st.appleBtnText}>Continuar com Apple</Text>
            </Pressable>
          ) : (
            <Pressable
              style={st.googleBtn}
              onPress={() => signIn({ name: 'Eduardo Castro', email: 'eduardo@ofir.com.br', role })}
            >
              <Text style={st.googleG}>G</Text>
              <Text style={st.googleBtnText}>Continuar com Google</Text>
            </Pressable>
          )}

          <View style={st.orRow}>
            <View style={st.orLine} />
            <Text style={st.orText}>ou com e-mail</Text>
            <View style={st.orLine} />
          </View>

          {mode === 'signup' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([['owner', 'Vou construir'], ['supplier', 'Sou fornecedor']] as const).map(([k, l]) => (
                  <Pressable key={k} onPress={() => setRole(k)} style={[st.role, role === k && { borderColor: C.accent }]}>
                    <Text style={{ fontWeight: '600', color: C.text }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={st.input} placeholder="Nome completo" placeholderTextColor={C.muted} value={f.name} onChangeText={t => setF({ ...f, name: t })} />
            </>
          )}

          <TextInput style={st.input} placeholder="voce@email.com" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={t => setF({ ...f, email: t })} />

          <View style={st.pwBox}>
            <TextInput
              style={[st.input, { flex: 1, borderWidth: 0, paddingRight: 42 }]}
              placeholder={mode === 'signup' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
              placeholderTextColor={C.muted}
              secureTextEntry={!showPass}
              value={f.pass}
              onChangeText={t => setF({ ...f, pass: t })}
            />
            <Pressable style={st.eyeBtn} onPress={() => setShowPass(!showPass)} hitSlop={8}>
              <Icon k={showPass ? 'eyeOff' : 'eye'} s={20} color={C.muted} />
            </Pressable>
          </View>

          {!!err && <Text style={{ color: C.warn }}>{err}</Text>}
          <Btn label={mode === 'login' ? 'Entrar' : 'Criar conta'} onPress={submit} />
          <Pressable onPress={() => { setErr(''); setMode(mode === 'login' ? 'signup' : 'login'); }}>
            <Text style={{ textAlign: 'center', color: C.accent, fontWeight: '600', paddingBottom: 12 }}>
              {mode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE FINALIZAR COMPRA (CHECKOUT COM SPLIT E TAXA DA PLATAFORMA 3%)
   ========================================================================= */
function CheckoutModal({
  visible,
  onClose,
  onSuccess,
  onOpenAddress
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: { pay: string; orders: Order[] }) => void;
  onOpenAddress: () => void;
}) {
  const { addresses, addrSel, selectAddress, checkout } = useStore();
  const { groups, totals, curAddress } = useOrc();
  const { C, st } = useTheme();
  const [payMethod, setPayMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [isPaying, setIsPaying] = useState(false);

  const okGroups = groups.filter(g => g.ok);
  const outGroups = groups.filter(g => !g.ok);

  const handlePay = () => {
    if (okGroups.length === 0 || isPaying) return;
    setIsPaying(true);
    setTimeout(() => {
      checkout(payMethod);
      setIsPaying(false);
      onClose();
      const currentLast = useStore.getState().lastCheckout;
      if (currentLast) {
        onSuccess(currentLast);
      }
    }, 800);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Finalizar contratação</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
          {/* Seção 1: Endereço de entrega */}
          <Text style={st.secLabel}>Endereço de entrega</Text>
          {addresses.map(a => {
            const isSel = a.id === addrSel;
            return (
              <Pressable
                key={a.id}
                onPress={() => selectAddress(a.id)}
                style={[st.card, isSel && { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSubtle }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[st.radioCircle, isSel && { borderColor: C.accent }]}>
                    {isSel && <View style={st.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.h4, isSel && { color: C.accent }]}>{a.label}</Text>
                    <Text style={st.muted}>{a.street}, {a.num} · {a.city}/{a.uf} · CEP {a.cep}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          <Btn small ghost label="+ Trocar ou cadastrar outro endereço" icon="pin" onPress={onOpenAddress} />

          {/* Seção 2: Pedidos que serão gerados */}
          <Text style={[st.secLabel, { marginTop: 8 }]}>Pedidos que serão gerados</Text>
          {okGroups.length > 0 ? (
            okGroups.map((g, idx) => (
              <View key={g.sup} style={st.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent, textTransform: 'uppercase' }}>
                      Pedido {idx + 1} de {okGroups.length}
                    </Text>
                    <Text style={[st.h4, { marginTop: 2 }]}>{g.sup}</Text>
                    <Text style={[st.muted, { marginTop: 2, fontSize: 12 }]}>
                      {g.items.length} {g.items.length > 1 ? 'itens/etapas' : 'item/etapa'} · liberado por etapa concluída
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{BRLc(g.total)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: C.warn, fontSize: 13 }}>Nenhum fornecedor do orçamento atende este endereço.</Text>
          )}

          {outGroups.length > 0 && (
            <View style={[st.policyBox, { borderColor: 'rgba(180,35,24,.3)', backgroundColor: 'rgba(180,35,24,.06)' }]}>
              <Icon k="x" s={18} color={C.warn} />
              <Text style={[st.policyText, { color: C.warn }]}>
                <Text style={{ fontWeight: '700' }}>Fora deste pedido: </Text>
                {outGroups.map(g => g.sup).join(', ')}. Não atendem {curAddress?.city || 'este endereço'}; os itens permanecem no orçamento.
              </Text>
            </View>
          )}

          {/* Seção 3: Forma de pagamento */}
          <Text style={[st.secLabel, { marginTop: 8 }]}>Forma de pagamento</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              ['pix', 'Pix', 'à vista'],
              ['card', 'Cartão', 'até 12x'],
              ['boleto', 'Boleto', '1 dia útil']
            ].map(([m, label, sub]) => {
              const active = payMethod === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setPayMethod(m as any)}
                  style={[
                    st.card,
                    { flex: 1, alignItems: 'center', paddingVertical: 12 },
                    active && { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSubtle }
                  ]}
                >
                  <Text style={[{ fontSize: 15, fontWeight: '700', color: C.text }, active && { color: C.accent }]}>{label}</Text>
                  <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Seção 4: TABELA DE CUSTÓDIA E SPLIT COM TAXA DA PLATAFORMA (3%) */}
          <Text style={[st.secLabel, { marginTop: 10 }]}>Como o pagamento é dividido (Custódia e Split)</Text>
          
          <View style={{ gap: 10 }}>
            {okGroups.map(g => {
              const fee = Math.round(g.total * 0.03);
              const net = Math.round(g.total * 0.97);
              return (
                <View key={g.sup} style={st.splitCard}>
                  <View style={st.splitCardTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={st.splitSupName}>{g.sup}</Text>
                      <Text style={st.splitSupSub}>liberado por etapa concluída</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={st.splitMiniLabel}>Valor total</Text>
                      <Text style={st.splitTotalVal}>{BRLc(g.total)}</Text>
                    </View>
                  </View>

                  <View style={st.splitDivider} />

                  <View style={st.splitCardBottom}>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.splitMiniLabel, { color: C.accent }]}>Taxa OFIR (3%)</Text>
                      <Text style={[st.splitVal, { color: C.accent }]}>{BRLc(fee)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flex: 1 }}>
                      <Text style={st.splitMiniLabel}>Fornecedor recebe (97%)</Text>
                      <Text style={[st.splitVal, { color: C.text }]}>{BRLc(net)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Nota de custódia e proteção */}
          <View style={st.policyBox}>
            <Icon k="shield" s={18} color={C.accent} />
            <Text style={st.policyText}>
              Você faz um único pagamento. A OFIR separa o valor de cada fornecedor, guarda em custódia protegida e libera conforme a conclusão de cada etapa da obra. A taxa sai da parte do fornecedor.
            </Text>
          </View>
        </ScrollView>

        {/* Rodapé fixo com total e botão de pagar */}
        <View style={st.bottomCheckoutBar}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: C.muted }}>Total a pagar ({payMethod.toUpperCase()})</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.accent }}>{BRLc(totals.total)}</Text>
          </View>
          <View style={{ width: 170 }}>
            <Btn
              disabled={okGroups.length === 0 || isPaying}
              label={isPaying ? 'Processando...' : `Contratar e pagar ${BRLc(totals.total)}`}
              icon={isPaying ? undefined : 'check'}
              onPress={handlePay}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE PAGAMENTO APROVADO / CONTRATAÇÃO REALIZADA
   ========================================================================= */
function OrderSuccessModal({
  data,
  onClose,
  onOpenOrder,
  onGoToOrders
}: {
  data: { pay: string; orders: Order[] } | null;
  onClose: () => void;
  onOpenOrder: (orderId: string) => void;
  onGoToOrders: () => void;
}) {
  const { C, st } = useTheme();
  if (!data) return null;

  const total = data.orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Pagamento aprovado</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', paddingVertical: 18, gap: 8 }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(31,122,85,.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon k="check" s={36} color={C.ok} sw={2.5} />
            </View>
            <HSerif size={26}>Contratação realizada</HSerif>
            <Text style={[st.muted, { textAlign: 'center', fontSize: 14 }]}>
              Pagamento {data.pay} · {BRLc(total)}
            </Text>
          </View>

          <Text style={st.secLabel}>
            {data.orders.length} {data.orders.length > 1 ? 'contratos de serviço gerados' : 'contrato de serviço gerado'}
          </Text>

          {data.orders.map(o => (
            <Pressable
              key={o.id}
              onPress={() => {
                onClose();
                onOpenOrder(o.id);
              }}
              style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
            >
              <View style={st.stageIconBox}>
                <Icon k="doc" s={20} color={C.accent} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>{o.id}</Text>
                <Text style={st.h4}>{o.sup}</Text>
                <Text style={st.muted}>{o.created} · {o.items?.length || 1} itens · {o.addr?.label || 'Obra'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontWeight: '800', color: C.text, fontSize: 15 }}>{BRLc(o.total)}</Text>
                <View style={[st.pill, o.done && st.pillOk]}>
                  <Text style={[st.pillText, o.done && st.pillTextOk]}>{o.status}</Text>
                </View>
              </View>
            </Pressable>
          ))}

          <View style={st.policyBox}>
            <Icon k="shield" s={18} color={C.accent} />
            <Text style={st.policyText}>
              Cada fornecedor recebeu a contratação do serviço. O valor permanece protegido em custódia até você confirmar a conclusão de cada etapa da obra.
            </Text>
          </View>

          <Btn
            label="Ver minhas etapas e pedidos"
            icon="doc"
            onPress={() => {
              onClose();
              onGoToOrders();
            }}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE DETALHES DO PEDIDO (COM BREAKDOWN DA TAXA E LIBERAÇÃO DE CUSTÓDIA)
   ========================================================================= */
function OrderDetailModal({
  orderId,
  onClose,
  onOpenChat
}: {
  orderId: string;
  onClose: () => void;
  onOpenChat: (convId: string) => void;
}) {
  const { orders, conversations, confirmOrder, cancelOrder, startQuote, toast } = useStore();
  const { C, st } = useTheme();
  const o = orders.find(x => x.id === orderId);

  if (!o) return null;

  const sup = SUPPLIERS.find(s => s.n === o.sup);
  const conv = conversations.find(c => c.n === o.sup);
  const cancelInfo = calc24hCancellation(o.createdAtMs, o.created);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar pedido (desistência 24h)',
      'Você está dentro do prazo de 24 horas. Deseja cancelar este pedido? O estorno de 100% será processado imediatamente sem multas.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar cancelamento',
          style: 'destructive',
          onPress: () => {
            cancelOrder(o.id, 'Desistência do cliente dentro da garantia de 24h');
            toast('Pedido cancelado', 'Estorno de 100% solicitado.');
          }
        }
      ]
    );
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirmar conclusão da etapa',
      'Confirma que recebeu todos os itens e autoriza a liberação do pagamento em custódia ao fornecedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar e liberar',
          onPress: () => {
            confirmOrder(o.id);
            Alert.alert('Pagamento liberado', 'O pagamento em custódia foi liberado com sucesso ao fornecedor!');
          }
        }
      ]
    );
  };

  const handleChat = () => {
    let cid = conv?.id;
    if (!cid && sup) {
      cid = startQuote(sup, false);
    }
    if (cid) {
      onClose();
      onOpenChat(cid);
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Pedido {o.id}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {/* Status & Custódia Banner */}
          <View style={[st.card, { gap: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={[st.pill, o.cancelled ? { backgroundColor: 'rgba(180,35,24,.12)' } : o.done ? st.pillOk : undefined]}>
                <Text style={[st.pillText, o.cancelled ? { color: C.warn } : o.done ? st.pillTextOk : undefined]}>
                  {o.cancelled ? 'Cancelado · Reembolsado' : o.status}
                </Text>
              </View>
              <Text style={st.muted}>{o.created}</Text>
            </View>
            <Text style={{ fontSize: 13, color: C.t2, lineHeight: 19 }}>{o.release}</Text>
          </View>

          {/* Banner de Cancelamento ou Garantia de 24h */}
          {o.cancelled ? (
            <View style={[st.card, { backgroundColor: 'rgba(180,35,24,.08)', borderColor: 'rgba(180,35,24,.25)', gap: 6 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon k="x" s={18} color={C.warn} />
                <Text style={{ fontWeight: '700', color: C.warn, fontSize: 14 }}>Pedido cancelado pelo cliente</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.muted, lineHeight: 18 }}>
                {o.cancelReason || 'Cancelado dentro da garantia de 24h.'} O estorno de 100% foi emitido automaticamente.
              </Text>
            </View>
          ) : !o.done && cancelInfo.canCancel ? (
            <View style={[st.card, { backgroundColor: C.accentSubtle, borderColor: C.accent, gap: 6 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon k="shield" s={18} color={C.accent} />
                <Text style={{ fontWeight: '700', color: C.accent, fontSize: 13 }}>Garantia de desistência em 24h</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.t2, lineHeight: 18 }}>
                Você pode cancelar este pedido gratuitamente com reembolso integral de 100%. Restam <Text style={{ fontWeight: '700', color: C.text }}>{cancelInfo.formattedRemaining}</Text>.
              </Text>
            </View>
          ) : null}

          {/* Fornecedor */}
          <View style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <View style={st.avatar}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(o.sup)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.h4}>{o.sup}</Text>
              <Text style={st.muted}>{sup ? stageName(sup.e) : ''} · {sup?.c || ''}</Text>
            </View>
            <Pressable onPress={handleChat} style={[st.stageIconBox, { backgroundColor: C.surface }]}>
              <Icon k="msg" s={18} color={C.accent} />
            </Pressable>
          </View>

          {/* Itens do pedido */}
          <Text style={st.secLabel}>Itens do pedido</Text>
          <View style={st.card}>
            {(o.items || []).map((i, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderColor: C.line
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>{i.n}</Text>
                  <Text style={st.muted}>{i.qty} {i.un} · {BRLc(i.p)} un</Text>
                </View>
                <Text style={{ fontWeight: '700', color: C.text, fontSize: 14 }}>{BRLc(i.p * i.qty)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 10, marginTop: 4, gap: 6 }}>
              {!!o.frete && o.frete > 0 && (
                <View style={st.row}>
                  <Text style={st.muted}>Taxa de mobilização</Text>
                  <Text style={{ fontWeight: '600', color: C.text }}>{BRLc(o.frete)}</Text>
                </View>
              )}
              <View style={st.row}>
                <Text style={st.h4}>Total do pedido</Text>
                <Text style={[st.h4, { color: C.accent }]}>{BRLc(o.total)}</Text>
              </View>
            </View>
          </View>

          {/* Local de execução da obra */}
          <Text style={st.secLabel}>Local de execução da obra</Text>
          <View style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Icon k="pin" s={20} color={C.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.text }}>{o.addr?.label || 'Obra'}</Text>
              <Text style={st.muted}>
                {o.addr ? `${o.addr.street}, ${o.addr.num} · ${o.addr.city}/${o.addr.uf} · CEP ${o.addr.cep}` : 'Endereço da obra'}
              </Text>
            </View>
          </View>

          {/* Pagamento e Divisão da Taxa */}
          <Text style={st.secLabel}>Pagamento e Divisão da Taxa (Split)</Text>
          <View style={[st.card, { gap: 8 }]}>
            <View style={st.row}>
              <Text style={st.muted}>Código do pagamento</Text>
              <Text style={{ fontWeight: '600', color: C.text }}>{o.pay}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.muted}>Forma de pagamento</Text>
              <Text style={{ fontWeight: '600', color: C.text }}>{o.method.toUpperCase()}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.muted}>Data</Text>
              <Text style={{ fontWeight: '600', color: C.text }}>{o.created}</Text>
            </View>
            <View style={[st.row, { borderTopWidth: 1, borderColor: C.line, paddingTop: 8 }]}>
              <Text style={{ color: C.text, fontWeight: '500' }}>Fornecedor recebe (97%)</Text>
              <Text style={{ fontWeight: '700', color: C.text }}>{BRLc(o.total - o.fee)}</Text>
            </View>
            <View style={st.row}>
              <Text style={{ color: C.accent, fontWeight: '700' }}>Taxa OFIR (3%)</Text>
              <Text style={{ fontWeight: '700', color: C.accent }}>{BRLc(o.fee)}</Text>
            </View>
            <Text style={[st.muted, { fontSize: 11, marginTop: 4 }]}>
              A taxa da plataforma remunera a segurança das transações, a custódia dos valores e o suporte em caso de problema.
            </Text>
          </View>

          {/* Ações */}
          <View style={{ gap: 10, marginTop: 6 }}>
            <Btn ghost label="Conversar com fornecedor" icon="msg" onPress={handleChat} />
            {!o.done && !o.cancelled && (
              <Btn
                label="Confirmar conclusão da etapa"
                icon="check"
                onPress={handleConfirm}
              />
            )}
            {!o.done && !o.cancelled && cancelInfo.canCancel && (
              <Btn
                ghost
                label="Cancelar pedido (desistência 24h)"
                icon="x"
                onPress={handleCancelOrder}
                style={{ borderColor: 'rgba(180,35,24,.3)' }}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE CADASTRO COMPLETO E FOTO DE PERFIL DO USUÁRIO
   ========================================================================= */
function UserProfileModal({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, updateUser, toast } = useStore();
  const { C, st } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '(11) 98765-4321');
  const [cpfCnpj, setCpfCnpj] = useState(user?.cpfCnpj || '123.456.789-00');
  const [city, setCity] = useState(user?.city || 'Atibaia');
  const [uf, setUf] = useState(user?.uf || 'SP');
  const [role, setRole] = useState<'owner' | 'supplier'>(user?.role || 'owner');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '(11) 98765-4321');
      setCpfCnpj(user.cpfCnpj || '123.456.789-00');
      setCity(user.city || 'Atibaia');
      setUf(user.uf || 'SP');
      setRole(user.role || 'owner');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user, visible]);

  const handlePickAvatar = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setAvatar(file.uri);
        updateUser({ avatar: file.uri });
        toast('Foto de perfil selecionada!');
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, informe seu nome e e-mail.');
      return;
    }
    updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cpfCnpj: cpfCnpj.trim(),
      city: city.trim(),
      uf: uf.trim().toUpperCase(),
      role,
      bio: bio.trim(),
      avatar
    });
    toast('Cadastro salvo com sucesso!', 'Seu perfil foi atualizado.');
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Cadastro e Perfil</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 50 }}>
          {/* Seção Foto de Perfil */}
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
            <View style={{ position: 'relative' }}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2.5, borderColor: C.accent }}
                />
              ) : (
                <View style={[st.avatar, { width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 30 }}>{initials(name || 'Eduardo')}</Text>
                </View>
              )}
              <Pressable
                onPress={handlePickAvatar}
                style={{
                  position: 'absolute', bottom: -2, right: -2, width: 32, height: 32,
                  borderRadius: 16, backgroundColor: C.accent, borderWidth: 2, borderColor: C.surface,
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icon k="camera" s={16} color="#fff" />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Btn small ghost label="Trocar foto" icon="camera" onPress={handlePickAvatar} />
              {!!avatar && (
                <Btn
                  small
                  ghost
                  label="Remover"
                  icon="x"
                  onPress={() => {
                    setAvatar('');
                    updateUser({ avatar: '' });
                    toast('Foto removida!');
                  }}
                />
              )}
            </View>
          </View>

          {/* Dados Pessoais */}
          <Text style={st.secLabel}>Dados Pessoais</Text>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>Nome completo *</Text>
            <TextInput
              style={st.input}
              placeholder="Seu nome"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>Tipo de perfil</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setRole('owner')}
                style={[
                  st.card,
                  { flex: 1, alignItems: 'center', paddingVertical: 10 },
                  role === 'owner' && { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSubtle }
                ]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700', color: C.text }, role === 'owner' && { color: C.accent }]}>
                  Proprietário
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRole('supplier')}
                style={[
                  st.card,
                  { flex: 1, alignItems: 'center', paddingVertical: 10 },
                  role === 'supplier' && { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSubtle }
                ]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700', color: C.text }, role === 'supplier' && { color: C.accent }]}>
                  Fornecedor
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>E-mail *</Text>
            <TextInput
              style={st.input}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu@email.com"
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>Telefone / WhatsApp</Text>
            <TextInput
              style={st.input}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              placeholderTextColor={C.muted}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>CPF ou CNPJ</Text>
            <TextInput
              style={st.input}
              placeholder="000.000.000-00"
              placeholderTextColor={C.muted}
              value={cpfCnpj}
              onChangeText={setCpfCnpj}
            />
          </View>

          {/* Localização */}
          <Text style={[st.secLabel, { marginTop: 6 }]}>Localização</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 3, gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>Cidade</Text>
              <TextInput
                style={st.input}
                placeholder="Cidade"
                placeholderTextColor={C.muted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1.2, gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>UF</Text>
              <TextInput
                style={st.input}
                maxLength={2}
                autoCapitalize="characters"
                placeholder="UF"
                placeholderTextColor={C.muted}
                value={uf}
                onChangeText={t => setUf(t.toUpperCase())}
              />
            </View>
          </View>

          {/* Sobre / Bio */}
          <View style={{ gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.t2 }}>Sobre a sua obra / Atuação</Text>
            <TextInput
              style={[st.input, { height: 72, paddingTop: 10 }]}
              multiline
              numberOfLines={3}
              placeholder="Conte mais sobre o projeto da sua obra..."
              placeholderTextColor={C.muted}
              value={bio}
              onChangeText={setBio}
            />
          </View>

          <Btn label="Salvar cadastro" icon="check" onPress={handleSave} style={{ marginTop: 12 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE MINHA OBRA (ETAPAS, CONTRATOS E PROGRESSO)
   ========================================================================= */
function MinhaObraModal({
  visible,
  onClose,
  onGoToStage,
  onOpenProjectAi
}: {
  visible: boolean;
  onClose: () => void;
  onGoToStage: (stage: string, sysKey?: string) => void;
  onOpenProjectAi?: () => void;
}) {
  const { C, st } = useTheme();

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Text style={[st.h4, { flex: 1, fontSize: 16 }]}>Minha obra</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {/* Resumo da Obra */}
          <View style={st.card}>
            <Text style={st.eyebrow}>Casa térrea</Text>
            <HSerif size={26}>420 m² · Painéis EPS</HSerif>
            <Text style={st.muted}>Atibaia, SP</Text>

            <View style={{ marginTop: 16, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Progresso geral</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>44%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: C.s3, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: '44%', height: '100%', backgroundColor: C.accent }} />
              </View>
            </View>

            {/* Checklist de etapas */}
            <View style={{ marginTop: 14, gap: 4 }}>
              {[
                ['Projeto aprovado', '12 ago', C.ok, true],
                ['Terraplenagem', '02 set', C.ok, true],
                ['Fundação', 'em andamento / contratada', C.accent, false],
                ['Estrutura e vedação', 'outubro', C.muted, false]
              ].map(([t, d, c, done]) => (
                <View key={t as string} style={st.stepRow}>
                  <View style={[st.stepDot, { backgroundColor: c as string }]} />
                  <Text style={[{ flex: 1, fontSize: 14, color: C.text }, done && { fontWeight: '600' }]}>{t as string}</Text>
                  <Text style={st.muted}>{d as string}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Atalho Análise de Projeto com IA */}
          {onOpenProjectAi && (
            <Pressable
              style={[st.card, { backgroundColor: C.accentSubtle, borderColor: C.accentBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
              onPress={() => {
                onClose();
                onOpenProjectAi();
              }}
            >
              <View style={st.stageIconBox}>
                <Icon k="doc" s={20} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.h4}>Analisar projeto arquitetônico</Text>
                <Text style={st.muted}>Anexe o PDF para sugerir materiais e fornecedores</Text>
              </View>
              <Icon k="next" s={16} color={C.accent} />
            </Pressable>
          )}

          {/* Contratos fechados */}
          <Text style={st.secLabel}>Contratos fechados</Text>
          {[
            ['Traço Arquitetura', 'Projeto · R$ 68.000 · concluído', 'Pago', true],
            ['Terra Plana Terraplenagem', 'Terreno · R$ 24.500 · concluído', 'Pago', true],
            ['Base Forte Fundações', 'Fundação · R$ 186.000 · etapa 1 de 3', 'Protegido', false]
          ].map(([sup, sub, pill, isPaid]) => (
            <View key={sup as string} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={st.avatar}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(sup as string)}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.h4}>{sup as string}</Text>
                <Text style={st.muted}>{sub as string}</Text>
              </View>
              <View style={[st.pill, isPaid ? st.pillOk : { backgroundColor: C.accentSubtle }]}>
                <Text style={[st.pillText, isPaid ? st.pillTextOk : { color: C.accent }]}>{pill as string}</Text>
              </View>
            </View>
          ))}

          {/* Próximo passo */}
          <Text style={st.secLabel}>Próximo passo recomendado</Text>
          <View style={[st.card, { gap: 8, borderColor: C.accent, backgroundColor: C.accentSubtle }]}>
            <Text style={[st.h4, { color: C.accent }]}>Contratar estrutura e vedação</Text>
            <Text style={{ fontSize: 13, color: C.t2, lineHeight: 19 }}>
              Compare os fornecedores na sua região para fechar com garantia de entrega e prazo protegido.
            </Text>
            <Btn
              small
              label="Ver fornecedores"
              icon="search"
              onPress={() => {
                onClose();
                onGoToStage('estrutura');
              }}
              style={{ marginTop: 4 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE MENSAGENS E NEGOCIAÇÕES
   ========================================================================= */
function MessagesModal({
  visible,
  onClose,
  onOpenChat,
  onOpenQuotes
}: {
  visible: boolean;
  onClose: () => void;
  onOpenChat: (convId: string) => void;
  onOpenQuotes: () => void;
}) {
  const { conversations, quotes } = useStore();
  const { C, st } = useTheme();

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Text style={[st.h4, { flex: 1, fontSize: 16 }]}>Mensagens e negociações</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View style={st.policyBox}>
            <Icon k="shield" s={18} color={C.accent} />
            <Text style={st.policyText}>
              Negocie e pague pela OFIR. Só contratos fechados aqui têm pagamento protegido e suporte em caso de problema.
            </Text>
          </View>

          {quotes.length > 0 && (
            <Pressable
              onPress={() => {
                onClose();
                onOpenQuotes();
              }}
              style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
            >
              <View style={st.stageIconBox}>
                <Icon k="orc" s={20} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.h4}>Cotações enviadas</Text>
                <Text style={st.muted}>Acompanhe pedidos de cotação para vários fornecedores</Text>
              </View>
              <View style={[st.pill, { backgroundColor: C.accentSubtle }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>{quotes.length}</Text>
              </View>
              <Icon k="next" s={16} color={C.muted} />
            </Pressable>
          )}

          <Text style={st.secLabel}>Conversas ativas</Text>
          {conversations.map(c => {
            const lastMsg = [...c.msgs].reverse().find(m => !['sys', 'ask'].includes(m.t));
            const lastText = lastMsg ? (lastMsg.t === 'prop' ? 'Enviou uma proposta de pagamento' : lastMsg.x || lastMsg.name || '') : '';
            const cd = calcQuoteCountdown(c);
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  onClose();
                  onOpenChat(c.id);
                }}
                style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
              >
                <View style={st.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(c.n)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[st.h4, { flex: 1, marginRight: 6 }]} numberOfLines={1}>{c.n}</Text>
                    {cd.hasProposal ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(31, 122, 85, 0.35)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                        <Icon k="check" s={11} color={C.ok || '#1f7a55'} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: C.ok || '#1f7a55' }}>Proposta</Text>
                      </View>
                    ) : cd.isExpired ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.line2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                        <Icon k="clock" s={11} color={C.muted} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: C.muted }}>Expirado</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.line2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                        <Icon k="clock" s={11} color={C.accent} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: C.accent, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{cd.hours}h {cd.minutes}m</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[st.muted, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{lastText}</Text>
                    <Text style={[st.muted, { fontSize: 11 }]}>{c.time}</Text>
                  </View>
                </View>
                {c.unread > 0 && (
                  <View style={[st.topMsgBadge, { position: 'relative', top: 0, right: 0 }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{c.unread}</Text>
                  </View>
                )}
                <Icon k="next" s={14} color={C.muted} />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}



/* =========================================================================
   MODAL DE CHECKOUT DA PROPOSTA NO CHAT (IGUAL AO SISTEMA DE PAGAMENTO)
   ========================================================================= */
function ProposalCheckoutModal({
  prop,
  conv,
  visible,
  onClose,
  onConfirmPayment,
  onOpenAddress
}: {
  prop: Proposal | null;
  conv: Conversation;
  visible: boolean;
  onClose: () => void;
  onConfirmPayment: (method: 'pix' | 'card' | 'boleto') => void;
  onOpenAddress?: () => void;
}) {
  const { addresses, addrSel } = useStore();
  const { C, st } = useTheme();
  const [payMethod, setPayMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [isPaying, setIsPaying] = useState(false);

  if (!prop) return null;
  const tot = prop.rows.reduce((acc, r) => acc + r[1], 0);
  const fee = Math.round(tot * 0.03);
  const net = tot - fee;
  const curAddr = addresses.find(a => a.id === addrSel) || addresses[0];

  const handlePay = () => {
    if (isPaying) return;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      onConfirmPayment(payMethod);
    }, 800);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Contratar e pagar proposta</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
          {/* Resumo da proposta */}
          <View style={[st.card, { gap: 6, borderColor: C.accentBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.eyebrow}>Contrato de Prestação de Serviços</Text>
              <View style={[st.pill, st.pillOk]}>
                <Text style={[st.pillText, st.pillTextOk]}>Etapa da Obra</Text>
              </View>
            </View>
            <Text style={[st.h4, { fontSize: 16 }]}>{prop.title}</Text>
            <Text style={st.muted}>{conv.n} · {prop.meta}</Text>
          </View>

          {/* Etapas e valores */}
          <Text style={st.secLabel}>Etapas contratadas</Text>
          <View style={st.card}>
            {prop.rows.map((r, i) => (
              <View
                key={r[0] + i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderColor: C.line
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>{r[0]}</Text>
                  <Text style={[st.muted, { fontSize: 12 }]}>Liberado após aprovação da etapa</Text>
                </View>
                <Text style={{ fontWeight: '700', color: C.text, fontSize: 14 }}>{BRLc(r[1])}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 10, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={st.h4}>Valor total do serviço</Text>
              <Text style={[st.h4, { color: C.accent }]}>{BRLc(tot)}</Text>
            </View>
          </View>

          {/* Endereço da obra */}
          <Text style={st.secLabel}>Local da obra e execução</Text>
          {curAddr ? (
            <View style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Icon k="pin" s={20} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.text }}>{curAddr.label}</Text>
                <Text style={st.muted}>{curAddr.street}, {curAddr.num} · {curAddr.city}/{curAddr.uf}</Text>
              </View>
              {onOpenAddress && (
                <Pressable onPress={onOpenAddress} hitSlop={6}>
                  <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>Trocar</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* Forma de pagamento */}
          <Text style={st.secLabel}>Forma de pagamento</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              ['pix', 'Pix', 'à vista'],
              ['card', 'Cartão', 'até 12x'],
              ['boleto', 'Boleto', '1 dia útil']
            ].map(([m, label, sub]) => {
              const active = payMethod === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setPayMethod(m as any)}
                  style={[
                    st.card,
                    { flex: 1, alignItems: 'center', paddingVertical: 12 },
                    active && { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSubtle }
                  ]}
                >
                  <Text style={[{ fontSize: 15, fontWeight: '700', color: C.text }, active && { color: C.accent }]}>{label}</Text>
                  <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custódia e Split (Taxa da plataforma 3%) */}
          <Text style={st.secLabel}>Divisão do pagamento (Custódia e Split)</Text>
          <View style={st.splitCard}>
            <View style={st.splitCardTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={st.splitSupName}>{conv.n}</Text>
                <Text style={st.splitSupSub}>liberado por etapa concluída</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={st.splitMiniLabel}>Valor total</Text>
                <Text style={st.splitTotalVal}>{BRLc(tot)}</Text>
              </View>
            </View>

            <View style={st.splitDivider} />

            <View style={st.splitCardBottom}>
              <View style={{ flex: 1 }}>
                <Text style={[st.splitMiniLabel, { color: C.accent }]}>Taxa OFIR (3%)</Text>
                <Text style={[st.splitVal, { color: C.accent }]}>{BRLc(fee)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={st.splitMiniLabel}>Fornecedor recebe (97%)</Text>
                <Text style={[st.splitVal, { color: C.text }]}>{BRLc(net)}</Text>
              </View>
            </View>
          </View>

          {/* Garantia de Custódia */}
          <View style={st.policyBox}>
            <Icon k="shield" s={18} color={C.accent} />
            <Text style={st.policyText}>
              Garantia de Custódia OFIR: O pagamento de {BRLc(tot)} fica protegido em conta garantia. A etapa 1 só é liberada ao fornecedor quando você confirmar a conclusão. A taxa de 3% sai da parte do fornecedor.
            </Text>
          </View>
        </ScrollView>

        {/* Rodapé fixo */}
        <View style={st.bottomCheckoutBar}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: C.muted }}>Total a pagar ({payMethod.toUpperCase()})</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.accent }}>{BRLc(tot)}</Text>
          </View>
          <View style={{ width: 180 }}>
            <Btn
              disabled={isPaying}
              label={isPaying ? 'Processando...' : `Contratar e pagar`}
              icon={isPaying ? undefined : 'check'}
              onPress={handlePay}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   COMPONENTE: RELÓGIO / SLA DE 72 HORAS PARA COTAÇÕES (MOBILE)
   ========================================================================= */
function MobileQuoteCountdown({ conv }: { conv: Conversation }) {
  const { C, st } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cd = calcQuoteCountdown(conv, now);

  if (cd.hasProposal) {
    return (
      <View style={[st.card, { borderColor: 'rgba(31, 122, 85, 0.35)', backgroundColor: C.surface, gap: 10, padding: 14, shadowOpacity: 0, elevation: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(31, 122, 85, 0.3)', backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon k="check" s={15} color={C.ok || '#1f7a55'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Orçamento recebido dentro do prazo</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>SLA OFIR cumprido pelo fornecedor</Text>
            </View>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'rgba(31, 122, 85, 0.35)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.ok || '#1f7a55' }}>72h Atendido</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: C.t2, lineHeight: 17 }}>
          O fornecedor enviou a proposta técnica e as etapas de pagamento dentro da janela de 72 horas.
        </Text>
      </View>
    );
  }

  if (cd.isExpired) {
    return (
      <View style={[st.card, { borderColor: C.line2, backgroundColor: C.surface, gap: 10, padding: 14, shadowOpacity: 0, elevation: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.line2, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon k="clock" s={15} color={C.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Prazo de 72h finalizado</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>Aguardando retorno do fornecedor</Text>
            </View>
          </View>
          <View style={{ borderWidth: 1, borderColor: C.line2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted }}>Tempo esgotado</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: C.t2, lineHeight: 17 }}>
          O prazo padrão de 72h encerrou. Você pode cobrar retorno ou consultar outros fornecedores.
        </Text>
      </View>
    );
  }

  return (
    <View style={[st.card, { borderColor: C.line2, backgroundColor: C.surface, gap: 10, padding: 14, shadowOpacity: 0, elevation: 0 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.line2, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon k="clock" s={15} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Prazo para envio do orçamento</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>SLA OFIR · Janela de até 72h</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 15, fontWeight: '700', color: C.text }}>
            {cd.formattedTime}
          </Text>
          <Text style={{ fontSize: 10, color: C.muted, fontWeight: '500' }}>{cd.formattedText}</Text>
        </View>
      </View>

      <View style={{ width: '100%', height: 3, backgroundColor: C.line2, borderRadius: 999, overflow: 'hidden' }}>
        <View style={{ width: `${cd.progressPercent}%`, height: '100%', backgroundColor: C.accent, borderRadius: 999 }} />
      </View>

      <Text style={{ fontSize: 12, color: C.t2, lineHeight: 17 }}>
        O fornecedor recebeu a solicitação e tem até 72 horas para analisar o projeto e formular a cotação. Acompanhe a contagem em tempo real.
      </Text>
    </View>
  );
}

/* =========================================================================
   MODAL DE CHAT INTERATIVO (COM PROPOSTA E ANEXO DE PROJETO PDF/DWG)
   ========================================================================= */
function ChatModal({
  convId,
  onClose,
  onSuccessPayment,
  onOpenAddress
}: {
  convId: string;
  onClose: () => void;
  onSuccessPayment?: (data: { pay: string; orders: Order[] }) => void;
  onOpenAddress?: () => void;
}) {
  const { conversations, proposals, addresses, addrSel, user, sendMessage, addFile, acceptProposal, toast } = useStore();
  const { C, st } = useTheme();
  const [inputText, setInputText] = useState('');
  const [payProposal, setPayProposal] = useState<Proposal | null>(null);
  const fileInputRef = useRef<any>(null);

  const c = conversations.find(x => x.id === convId);
  if (!c) return null;

  const handlePickFromDevice = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*', 'application/pdf', '.dwg', '.dxf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const sizeFormatted = file.size
          ? file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`
          : '3.2 MB';
        addFile(c.id, {
          name: file.name,
          size: sizeFormatted
        });
        toast('Projeto anexado e enviado!', file.name);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(c.id, inputText.trim());
    setInputText('');
  };


  const handleConfirmProposalPayment = (method: 'pix' | 'card' | 'boleto') => {
    if (!payProposal) return;
    const prop = payProposal;
    const tot = prop.rows.reduce((acc, r) => acc + r[1], 0);
    const fee = Math.round(tot * 0.03);
    const orderId = 'PED-' + Math.floor(1000 + Math.random() * 9000);
    const payId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
    const currentAddr = addresses.find(a => a.id === addrSel) || addresses[0];

    // Aceita proposta no store da aplicação
    acceptProposal(prop.id);

    // Cria o pedido de prestação de serviço contratado
    const newOrder: Order = {
      id: orderId,
      pay: payId,
      sup: c.n,
      total: tot,
      sub: tot,
      frete: 0,
      fee,
      created: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      method: method === 'pix' ? 'Pix à vista' : method === 'card' ? 'Cartão 12x' : 'Boleto',
      status: 'Etapa 1 em andamento',
      release: 'Valor liberado por etapa concluída após sua confirmação',
      done: false,
      hasMat: false,
      items: prop.rows.map((r, i) => ({
        id: 'pi-' + i,
        kind: 'svc',
        sup: c.n,
        n: r[0],
        un: 'etapa',
        p: r[1],
        qty: 1
      })),
      addr: currentAddr || { id: 'a1', label: 'Minha Obra', street: 'Av. das Palmeiras', num: '120', city: 'Atibaia', uf: 'SP', cep: '12940-000' },
      client: user ? user.name : 'Você'
    };

    useStore.setState(s => ({
      orders: [newOrder, ...s.orders],
      lastCheckout: { pay: payId, orders: [newOrder] }
    }));

    setPayProposal(null);
    onClose();

    if (onSuccessPayment) {
      onSuccessPayment({ pay: payId, orders: [newOrder] });
    } else {
      toast('Contratação realizada!', `${prop.title} · ${BRLc(tot)}`);
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[st.h4, { fontSize: 15 }]} numberOfLines={1}>{c.n}</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>{c.e || 'Fornecedor'}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}>
          <MobileQuoteCountdown conv={c} />
          <View style={st.sysMsg}>
            <Text style={st.sysMsgText}>Hoje</Text>
          </View>

          {c.msgs.map((m, idx) => {
            if (m.t === 'sys') {
              return (
                <View key={idx} style={st.sysMsg}>
                  <Text style={st.sysMsgText}>{m.x}</Text>
                </View>
              );
            }

            if (m.t === 'ask') {
              return (
                <View key={idx} style={[st.card, { gap: 8, borderColor: C.accent, backgroundColor: C.accentSubtle }]}>
                  <Text style={[st.h4, { color: C.accent }]}>Envie o projeto arquitetônico ou executivo</Text>
                  <Text style={{ fontSize: 13, color: C.t2, lineHeight: 18 }}>
                    O prestador usa o projeto técnico para avaliar as etapas e enviar a cotação. Aceita projetos em PDF ou DWG (AutoCAD).
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <Btn
                      small
                      label="Anexar projeto (PDF ou DWG)"
                      icon="clip"
                      onPress={handlePickFromDevice}
                    />
                  </View>
                </View>
              );
            }

            if (m.t === 'file') {
              const isDwg = m.name?.toLowerCase().endsWith('.dwg');
              const isPdf = m.name?.toLowerCase().endsWith('.pdf');
              return (
                <View
                  key={idx}
                  style={[
                    st.card,
                    {
                      maxWidth: '88%',
                      alignSelf: m.me ? 'flex-end' : 'flex-start',
                      backgroundColor: m.me ? C.accentSubtle : C.surface,
                      borderColor: m.me ? C.accentBorder : C.line,
                      gap: 8
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={[
                        st.stageIconBox,
                        {
                          width: 40,
                          height: 40,
                          backgroundColor: isDwg
                            ? 'rgba(2,132,199,.12)'
                            : isPdf
                            ? 'rgba(225,29,72,.12)'
                            : C.accentSubtle,
                          borderColor: isDwg
                            ? 'rgba(2,132,199,.3)'
                            : isPdf
                            ? 'rgba(225,29,72,.3)'
                            : C.accentBorder
                        }
                      ]}
                    >
                      <Icon
                        k="doc"
                        s={20}
                        color={isDwg ? '#0284c7' : isPdf ? '#e11d48' : C.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: isDwg ? 'rgba(2,132,199,.15)' : 'rgba(225,29,72,.15)'
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: isDwg ? '#0284c7' : '#e11d48'
                            }}
                          >
                            {isDwg ? 'DWG · CAD' : isPdf ? 'PDF' : 'PROJETO'}
                          </Text>
                        </View>
                        <Text style={st.muted}>{m.size}</Text>
                      </View>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: C.text, marginTop: 2 }} numberOfLines={1}>
                        {m.name}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: C.line, paddingTop: 6 }}>
                    <Text style={{ fontSize: 11, color: C.muted }}>{m.h || 'hoje'}</Text>
                    <Pressable
                      onPress={() => toast('Abrindo visualizador do projeto...', m.name)}
                      hitSlop={6}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isDwg ? '#0284c7' : C.accent }}>
                        Visualizar arquivo
                      </Text>
                      <Icon k="next" s={12} color={isDwg ? '#0284c7' : C.accent} />
                    </Pressable>
                  </View>
                </View>
              );
            }

            if (m.t === 'prop') {
              const prop = proposals[m.id!];
              if (!prop) return null;
              const tot = prop.rows.reduce((acc, r) => acc + r[1], 0);
              return (
                <View key={idx} style={[st.card, { gap: 10, borderColor: C.accent }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={st.eyebrow}>Solicitação de pagamento</Text>
                    <View style={[st.pill, prop.status === 'paid' && st.pillOk]}>
                      <Text style={[st.pillText, prop.status === 'paid' && st.pillTextOk]}>
                        {prop.status === 'open' ? 'Aguardando você' : 'Contrato fechado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={st.h4}>{prop.title}</Text>
                  <Text style={st.muted}>{prop.meta}</Text>

                  <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 8, gap: 6 }}>
                    {prop.rows.map(r => (
                      <View key={r[0]} style={st.row}>
                        <Text style={st.t2}>{r[0]}</Text>
                        <Text style={{ fontWeight: '600', color: C.text }}>{BRLc(r[1])}</Text>
                      </View>
                    ))}
                    <View style={[st.row, { borderTopWidth: 1, borderColor: C.line, paddingTop: 6 }]}>
                      <Text style={st.h4}>Total do serviço</Text>
                      <Text style={[st.h4, { color: C.accent }]}>{BRLc(tot)}</Text>
                    </View>
                  </View>

                  {prop.status === 'open' ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <Btn
                        small
                        ghost
                        label="Negociar"
                        onPress={() => setInputText('Gostaria de negociar os valores e prazos desta proposta.')}
                        style={{ flex: 1 }}
                      />
                      <Btn
                        small
                        label="Aceitar e pagar"
                        icon="check"
                        onPress={() => setPayProposal(prop)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  ) : (
                    <View style={st.policyBox}>
                      <Icon k="shield" s={16} color={C.accent} />
                      <Text style={st.policyText}>
                        {BRLc(tot)} protegido em custódia. A etapa 1 é liberada ao fornecedor quando você confirmar que foi concluída.
                      </Text>
                    </View>
                  )}
                </View>
              );
            }

            const isMe = m.t === 'me';
            return (
              <View key={idx} style={[st.chatBubble, isMe ? st.chatMe : st.chatThem]}>
                <Text style={isMe ? st.chatTextMe : st.chatTextThem}>{m.x}</Text>
                {!!m.h && <Text style={isMe ? st.chatTimeMe : st.chatTime}>{m.h}</Text>}
              </View>
            );
          })}
        </ScrollView>

        {/* Barra de composição da mensagem com botão de clipe para anexar do dispositivo */}
        <View style={st.chatComposer}>
          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                const f = (e.target as any).files?.[0];
                if (f) {
                  const sizeFormatted = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
                  addFile(c.id, { name: f.name, size: sizeFormatted });
                  toast('Projeto anexado e enviado!', f.name);
                }
              }}
            />
          )}
          <Pressable onPress={handlePickFromDevice} hitSlop={8} style={{ padding: 6 }} accessibilityLabel="Anexar arquivo do dispositivo">
            <Icon k="clip" s={22} color={C.accent} />
          </Pressable>
          <TextInput
            style={[st.input, { flex: 1, height: 42 }]}
            placeholder="Mensagem para o fornecedor..."
            placeholderTextColor={C.muted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} disabled={!inputText.trim()} style={{ padding: 6 }}>
            <Icon k="next" s={22} color={inputText.trim() ? C.accent : C.muted} />
          </Pressable>
        </View>


        {/* Modal de Pagamento da Proposta (Fluxo idêntico ao checkout) */}
        <ProposalCheckoutModal
          prop={payProposal}
          conv={c}
          visible={!!payProposal}
          onClose={() => setPayProposal(null)}
          onConfirmPayment={handleConfirmProposalPayment}
          onOpenAddress={onOpenAddress}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE COTAÇÕES ENVIADAS
   ========================================================================= */
function QuotesModal({
  visible,
  onClose,
  onOpenQuote
}: {
  visible: boolean;
  onClose: () => void;
  onOpenQuote: (quoteId: string) => void;
}) {
  const { quotes } = useStore();
  const { C, st } = useTheme();

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Text style={[st.h4, { flex: 1, fontSize: 16 }]}>Cotações enviadas</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View style={st.policyBox}>
            <Icon k="shield" s={18} color={C.accent} />
            <Text style={st.policyText}>
              Peça cotação a vários fornecedores de uma vez. Selecione fornecedores na busca, anexe o projeto uma vez e compare as propostas aqui.
            </Text>
          </View>

          {quotes.map(q => (
            <Pressable
              key={q.id}
              onPress={() => {
                onClose();
                onOpenQuote(q.id);
              }}
              style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
            >
              <View style={st.stageIconBox}>
                <Icon k="orc" s={20} color={C.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.h4}>{q.label}</Text>
                <Text style={st.muted}>{q.id} · {q.created} · {q.items.length} fornecedores</Text>
              </View>
              <View style={[st.pill, { backgroundColor: q.cancelled ? 'rgba(180,35,24,.12)' : C.accentSubtle }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: q.cancelled ? C.warn : C.accent }}>
                  {q.cancelled ? 'Cancelada' : `${q.items.length} respostas`}
                </Text>
              </View>
              <Icon k="next" s={16} color={C.muted} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE DETALHE DA COTAÇÃO
   ========================================================================= */
function QuoteDetailModal({
  quoteId,
  onClose,
  onOpenChat
}: {
  quoteId: string;
  onClose: () => void;
  onOpenChat: (convId: string) => void;
}) {
  const { quotes, conversations, startQuote, cancelQuote, deleteQuote, toast } = useStore();
  const { C, st } = useTheme();
  const q = quotes.find(x => x.id === quoteId);

  if (!q) return null;

  const cancelInfo = calc24hCancellation(q.createdAtMs, q.created);

  const handleCancelQuote = () => {
    Alert.alert(
      'Cancelar cotação (24h)',
      'Deseja cancelar esta solicitação de orçamento? Seus fornecedores serão notificados da desistência.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar cancelamento',
          style: 'destructive',
          onPress: () => {
            cancelQuote(q.id, 'Desistência em até 24h');
            toast('Cotação cancelada', 'A solicitação foi cancelada com sucesso.');
          }
        }
      ]
    );
  };

  const handleDeleteQuote = () => {
    Alert.alert(
      'Excluir cotação',
      'Tem certeza de que deseja remover esta cotação do seu histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteQuote(q.id);
            toast('Cotação removida', 'A cotação foi excluída.');
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={st.modalHead}>
          <Pressable onPress={onClose} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon k="back" s={18} color={C.text} />
            <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Voltar</Text>
          </Pressable>
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>Cotação {q.id}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View style={st.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.eyebrow}>{q.id}</Text>
              {q.cancelled && (
                <View style={[st.pill, { backgroundColor: 'rgba(180,35,24,.12)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.warn }}>CANCELADA</Text>
                </View>
              )}
            </View>
            <HSerif size={22}>{q.label}</HSerif>
            <Text style={[st.muted, { marginTop: 4 }]}>Criada em {q.created} · {q.items.length} fornecedores consultados</Text>
          </View>

          {q.cancelled ? (
            <View style={[st.card, { backgroundColor: 'rgba(180,35,24,.08)', borderColor: 'rgba(180,35,24,.25)', gap: 6 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon k="x" s={18} color={C.warn} />
                <Text style={{ fontWeight: '700', color: C.warn, fontSize: 14 }}>Cotação cancelada</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.muted, lineHeight: 18 }}>
                {q.cancelReason || 'Cancelada pelo cliente dentro do prazo.'}
              </Text>
            </View>
          ) : cancelInfo.canCancel ? (
            <View style={[st.card, { backgroundColor: C.accentSubtle, borderColor: C.accent, gap: 6 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon k="shield" s={18} color={C.accent} />
                <Text style={{ fontWeight: '700', color: C.accent, fontSize: 13 }}>Garantia de 24h para alteração ou desistência</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.t2, lineHeight: 18 }}>
                Você pode cancelar ou excluir esta solicitação a qualquer momento nas primeiras 24h. Restam <Text style={{ fontWeight: '700', color: C.text }}>{cancelInfo.formattedRemaining}</Text>.
              </Text>
            </View>
          ) : null}

          <Text style={st.secLabel}>Fornecedores cotados ({q.items.length})</Text>
          {q.items.map(it => {
            const sup = SUPPLIERS.find(s => s.n === it.sup);
            const conv = conversations.find(c => c.n === it.sup);
            return (
              <View key={it.sup} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={st.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(it.sup)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.h4}>{it.sup}</Text>
                  <Text style={st.muted}>{sup ? stageName(sup.e) : ''} · {sup?.c || ''}</Text>
                </View>
                <Btn
                  small
                  ghost
                  label="Abrir conversa"
                  icon="msg"
                  onPress={() => {
                    let cid = conv?.id;
                    if (!cid && sup) cid = startQuote(sup, false);
                    if (cid) {
                      onClose();
                      onOpenChat(cid);
                    }
                  }}
                />
              </View>
            );
          })}

          <View style={{ gap: 8, marginTop: 12 }}>
            {!q.cancelled && cancelInfo.canCancel && (
              <Btn
                ghost
                label="Cancelar cotação (desistência 24h)"
                icon="x"
                onPress={handleCancelQuote}
                style={{ borderColor: 'rgba(180,35,24,.3)' }}
              />
            )}
            <Btn
              ghost
              label="Excluir cotação do histórico"
              icon="trash"
              onPress={handleDeleteQuote}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* =========================================================================
   MODAL DE ANÁLISE DE PROJETO COM IA (MOBILE)
   ========================================================================= */
function ProjectAnalyzerModal({
  visible,
  onClose,
  onOpenQuote,
  onOpenProfile
}: {
  visible: boolean;
  onClose: () => void;
  onOpenQuote: (quoteId: string) => void;
  onOpenProfile: (name: string) => void;
}) {
  const {
    obra, addresses, addrSel, projectAnalyses, saveAnalysis, removeAnalysis,
    toggleChecklistItem, toggleChecklistSupplier, setAllChecklist, sendChecklistQuotes,
    requireAuth, toast
  } = useStore();
  const { C, st } = useTheme();

  const [phase, setPhase] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: string; uri: string; base64?: string } | null>(null);
  const [tab, setTab] = useState<'svc' | 'mat'>('svc');
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (projectAnalyses.length > 0 && !activeId) {
        setActiveId(projectAnalyses[0].id);
        setPhase('result');
      } else if (!projectAnalyses.length) {
        setPhase('upload');
      }
    }
  }, [visible, projectAnalyses.length]);

  const analysis = projectAnalyses.find(a => a.id === activeId) || null;

  const handlePickDocument = async () => {
    setError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        const formattedSize = a.size
          ? a.size > 1024 * 1024
            ? `${(a.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(a.size / 1024)} KB`
          : 'Projeto em PDF';

        let base64: string | undefined = undefined;
        try {
          if (Platform.OS === 'web') {
            const resp = await fetch(a.uri);
            const blob = await resp.blob();
            base64 = await new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const s = String(reader.result || '');
                resolve(s.split(',')[1] || '');
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // base64 opcional, fallback simulado funciona perfeitamente
        }

        setFile({
          name: a.name || 'projeto.pdf',
          size: formattedSize,
          uri: a.uri,
          base64
        });
      }
    } catch {
      setError('Não foi possível carregar o arquivo.');
    }
  };

  const handleRunAnalysis = async (withFile: boolean) => {
    setError(null);
    setPhase('analyzing');
    setStep(0);
    const stepsTimer = setInterval(() => {
      setStep(s => Math.min(4, s + 1));
    }, 850);

    try {
      const curA = addresses.find(a => a.id === addrSel);
      const city = curA?.city || obra.city;
      const uf = curA?.uf || obra.uf;

      const result = await analyzeProject({
        base64: withFile && file ? file.base64 : undefined,
        fileName: withFile && file ? file.name : undefined,
        fileSize: withFile && file ? file.size : undefined,
        ctx: {
          obraName: obra.name,
          area: obra.area,
          systemKey: obra.systemKey,
          systemName: obra.system,
          city,
          uf
        }
      });
      clearInterval(stepsTimer);
      saveAnalysis(result);
      setActiveId(result.id);
      setPhase('result');
      setFile(null);
      toast('Checklist pronto', `${result.items.length} itens identificados.`);
    } catch (err: any) {
      clearInterval(stepsTimer);
      setError(err instanceof ProjectAIError ? err.message : 'Falha ao analisar o projeto. Tente novamente.');
      setPhase('upload');
    }
  };

  const stats = useMemo(() => {
    if (!analysis) return { checked: 0, sups: 0, svc: 0, mat: 0 };
    const checked = analysis.items.filter(i => i.checked && i.selected.length);
    const sups = new Set(checked.flatMap(i => i.selected));
    return {
      checked: checked.length,
      sups: sups.size,
      svc: analysis.items.filter(i => i.kind === 'svc').length,
      mat: analysis.items.filter(i => i.kind === 'mat').length
    };
  }, [analysis]);

  const groups = useMemo(() => {
    if (!analysis) return [] as [string, ChecklistItem[]][];
    const m = new Map<string, ChecklistItem[]>();
    analysis.items.filter(i => i.kind === tab).forEach(i => {
      if (!m.has(i.cat)) m.set(i.cat, []);
      m.get(i.cat)!.push(i);
    });
    return [...m];
  }, [analysis, tab]);

  const stepsText = [
    'Lendo pranchas e cortes do PDF...',
    'Identificando ambientes e áreas...',
    'Calculando quantitativos de materiais...',
    'Estruturando o checklist da obra...',
    'Mapeando fornecedores da região...'
  ];

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header do Modal */}
        <View style={st.modalHead}>
          {phase === 'result' ? (
            <Pressable
              onPress={() => setPhase('upload')}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Icon k="back" s={18} color={C.text} />
              <Text style={{ fontWeight: '600', color: C.text, fontSize: 14 }}>Novo</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={[st.h4, { flex: 1, textAlign: 'center', fontSize: 16 }]}>
            {phase === 'result' ? 'Checklist com IA' : 'Análise de projeto'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon k="x" s={20} color={C.text} />
          </Pressable>
        </View>

        {/* FASE: UPLOAD */}
        {phase === 'upload' && (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
            {/* Hero */}
            <View style={[st.card, { backgroundColor: C.accent, borderColor: C.accent2, gap: 8, padding: 18 }]}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#c9f2e3', textTransform: 'uppercase', letterSpacing: 0.5 }}>IA OFIR</Text>
              </View>
              <HSerif size={22} style={{ color: '#ffffff' }}>Envie o projeto e receba o checklist da obra</HSerif>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19 }}>
                A IA lê as plantas, estima quantidades e sugere fornecedores da sua região para você enviar pedidos de orçamento de uma vez só.
              </Text>
            </View>

            {/* Caixa de anexo do PDF */}
            <Pressable
              onPress={handlePickDocument}
              style={[
                st.card,
                {
                  borderStyle: 'dashed',
                  borderWidth: 1.5,
                  borderColor: file ? C.accent : C.line2,
                  alignItems: 'center',
                  paddingVertical: 24,
                  gap: 8,
                  backgroundColor: file ? C.accentSubtle : C.surface
                }
              ]}
            >
              <View style={[st.stageIconBox, { backgroundColor: file ? C.accent : C.s2 }]}>
                <Icon k="doc" s={24} color={file ? '#ffffff' : C.accent} />
              </View>
              {file ? (
                <>
                  <Text style={[st.h4, { textAlign: 'center' }]}>{file.name}</Text>
                  <Text style={[st.muted, { fontSize: 12 }]}>{file.size} · Toque para trocar de arquivo</Text>
                </>
              ) : (
                <>
                  <Text style={[st.h4, { textAlign: 'center' }]}>Toque para anexar o PDF do projeto</Text>
                  <Text style={[st.muted, { fontSize: 12 }]}>Plantas arquitetônicas, cortes ou fachadas</Text>
                </>
              )}
            </Pressable>

            {error && (
              <View style={{ backgroundColor: 'rgba(180,35,24,.1)', borderWidth: 1, borderColor: 'rgba(180,35,24,.25)', padding: 10, borderRadius: 10 }}>
                <Text style={{ color: C.warn, fontSize: 12 }}>{error}</Text>
              </View>
            )}

            {/* Contexto da obra */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View style={[st.pill, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }]}>
                <Text style={{ color: C.text, fontSize: 12 }}>{obra.name} · {obra.area} m²</Text>
              </View>
              <View style={[st.pill, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }]}>
                <Text style={{ color: C.text, fontSize: 12 }}>{obra.system}</Text>
              </View>
              <View style={[st.pill, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }]}>
                <Text style={{ color: C.text, fontSize: 12 }}>{obra.city}/{obra.uf}</Text>
              </View>
            </View>

            <Btn
              label="Analisar projeto com IA"
              icon="doc"
              disabled={!file}
              onPress={() => handleRunAnalysis(true)}
              style={{ marginTop: 6 }}
            />

            <Pressable onPress={() => handleRunAnalysis(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: C.accent, fontWeight: '600' }}>
                Ainda não tenho o projeto · gerar checklist pelos dados da obra
              </Text>
            </Pressable>

            {projectAnalyses.length > 0 && (
              <>
                <Text style={st.secLabel}>Análises anteriores</Text>
                {projectAnalyses.map(a => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      setActiveId(a.id);
                      setPhase('result');
                    }}
                    style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
                  >
                    <View style={st.stageIconBox}>
                      <Icon k="doc" s={18} color={C.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.h4}>{a.fileName || 'Checklist estimado'}</Text>
                      <Text style={st.muted}>{a.items.length} itens sugeridos</Text>
                    </View>
                    <Icon k="next" s={16} color={C.muted} />
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        )}

        {/* FASE: ANALISANDO */}
        {phase === 'analyzing' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
            <ActivityIndicator size="large" color={C.accent} />
            <HSerif size={22} style={{ textAlign: 'center' }}>
              Analisando {file ? 'o projeto' : 'os dados da obra'}...
            </HSerif>
            <Text style={[st.muted, { textAlign: 'center' }]}>
              {file ? file.name : `${obra.name} · ${obra.area} m²`}
            </Text>
            <View style={[st.card, { width: '100%', gap: 10, padding: 16, marginTop: 12 }]}>
              {stepsText.map((txt, idx) => (
                <View key={txt} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: idx < step ? C.ok : idx === step ? C.accent : C.s3,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {idx < step && <Icon k="check" s={12} color="#fff" sw={2.5} />}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: idx <= step ? C.text : C.muted,
                      fontWeight: idx === step ? '700' : '400'
                    }}
                  >
                    {txt}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FASE: RESULTADO / CHECKLIST */}
        {phase === 'result' && analysis && (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
              {/* Resumo da Análise */}
              <View style={[st.card, { gap: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={st.eyebrow}>Resumo do projeto</Text>
                  <View style={[st.pill, { backgroundColor: C.accentSubtle }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.accent }}>
                      {analysis.source === 'gpt' ? 'GPT-4o IA' : analysis.source === 'gemini' ? 'Gemini IA' : 'Estimativa inteligente'}
                    </Text>
                  </View>
                </View>

                <HSerif size={22}>{analysis.summary.tipo}</HSerif>
                <Text style={st.muted}>
                  {analysis.fileName ? `Analisado a partir de ${analysis.fileName}` : 'Gerado a partir dos dados da obra'}
                </Text>

                {/* Grid de KPIs */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  <View style={{ width: '48%', backgroundColor: C.s2, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.muted }}>Área total</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{analysis.summary.area} m²</Text>
                  </View>
                  <View style={{ width: '48%', backgroundColor: C.s2, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.muted }}>Quartos / Banheiros</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{analysis.summary.quartos} qtos · {analysis.summary.banheiros} bths</Text>
                  </View>
                  <View style={{ width: '100%', backgroundColor: C.s2, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.muted }}>Sistema sugerido</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{analysis.summary.sistema || obra.system}</Text>
                  </View>
                </View>

                {analysis.summary.ambientes.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                    {analysis.summary.ambientes.map(a => (
                      <View key={a} style={[st.pill, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line2 }]}>
                        <Text style={{ fontSize: 11, color: C.text }}>{a}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Banner Consultivo OFIR */}
              <View style={[st.card, { backgroundColor: C.accentSubtle, borderColor: C.accent, gap: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon k="shield" s={18} color={C.accent} />
                  <Text style={{ fontWeight: '700', color: C.accent, fontSize: 13 }}>Consultoria Inteligente OFIR</Text>
                </View>
                <Text style={{ fontSize: 12, color: C.t2, lineHeight: 18 }}>
                  Sugerimos fornecedores analisando <Text style={{ fontWeight: '700', color: C.text }}>logística e distância da obra (menor frete)</Text>, <Text style={{ fontWeight: '700', color: C.text }}>reputação verificada</Text> e <Text style={{ fontWeight: '700', color: C.text }}>custo-benefício</Text>. Você tem total liberdade para manter, marcar ou desmarcar qualquer fornecedor.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderColor: 'rgba(23,74,64,.12)' }}>
                  <Icon k="check" s={14} color={C.ok} />
                  <Text style={{ fontSize: 11, color: C.text, fontWeight: '600' }}>
                    Garantia de 24h: cancele ou exclua solicitações e pedidos a qualquer momento se houver desistência.
                  </Text>
                </View>
              </View>

              {/* Status de Cotação Enviada */}
              {analysis.quoteId && (
                <View style={[st.card, { backgroundColor: 'rgba(31,122,85,.08)', borderColor: C.ok, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.ok, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon k="check" s={18} color="#fff" sw={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: C.text, fontSize: 14 }}>Cotações enviadas ({analysis.quoteId})</Text>
                    <Text style={{ fontSize: 12, color: C.t2 }}>Aguardando propostas dos fornecedores em até 72h.</Text>
                  </View>
                  <Btn small label="Ver" onPress={() => onOpenQuote(analysis.quoteId!)} />
                </View>
              )}

              {/* Abas Serviços vs Materiais */}
              <View style={{ flexDirection: 'row', backgroundColor: C.s2, borderRadius: 10, padding: 3 }}>
                <Pressable
                  onPress={() => setTab('svc')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: tab === 'svc' ? C.surface : 'transparent'
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'svc' ? C.text : C.muted }}>
                    Serviços ({stats.svc})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTab('mat')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: tab === 'mat' ? C.surface : 'transparent'
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'mat' ? C.text : C.muted }}>
                    Materiais ({stats.mat})
                  </Text>
                </Pressable>
              </View>

              {/* Ações em lote */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Text style={st.secLabel}>Itens necessários ({stats.checked} marcados)</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => setAllChecklist(analysis.id, true, tab)}>
                    <Text style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>Marcar todos</Text>
                  </Pressable>
                  <Pressable onPress={() => setAllChecklist(analysis.id, false, tab)}>
                    <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>Desmarcar</Text>
                  </Pressable>
                </View>
              </View>

              {/* Grupos de Itens */}
              {groups.map(([cat, list]) => (
                <View key={cat} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: C.accentSubtle, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon k={cat} s={14} color={C.accent} />
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: C.text }}>{catLabel(cat)}</Text>
                    <Text style={[st.muted, { fontSize: 12 }]}>({list.length})</Text>
                  </View>

                  {list.map(it => (
                    <View
                      key={it.id}
                      style={[
                        st.card,
                        {
                          gap: 10,
                          opacity: it.checked ? 1 : 0.6,
                          borderColor: it.checked ? C.accentBorder : C.line
                        }
                      ]}
                    >
                      <Pressable
                        onPress={() => toggleChecklistItem(analysis.id, it.id)}
                        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 1.5,
                            borderColor: it.checked ? C.accent : C.line2,
                            backgroundColor: it.checked ? C.accent : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2
                          }}
                        >
                          {it.checked && <Icon k="check" s={13} color="#fff" sw={3} />}
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[st.h4, { flex: 1 }]}>{it.title}</Text>
                            {it.qty && (
                              <View style={[st.pill, { backgroundColor: C.s2 }]}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: C.text }}>
                                  {it.qty} {it.un}
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                st.pill,
                                {
                                  backgroundColor: it.priority === 'alta' ? 'rgba(180,35,24,.1)' : C.s2
                                }
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '700',
                                  color: it.priority === 'alta' ? C.warn : C.muted
                                }}
                              >
                                {it.priority}
                              </Text>
                            </View>
                          </View>
                          {it.detail ? <Text style={[st.muted, { fontSize: 12 }]}>{it.detail}</Text> : null}
                        </View>
                      </Pressable>

                      {/* Fornecedores sugeridos com Consultoria Inteligente */}
                      {it.suppliers.length > 0 && (
                        <View style={{ gap: 8, borderTopWidth: 1, borderColor: C.line, paddingTop: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>
                              Sugestões consultivas (escolha livre):
                            </Text>
                            <Text style={{ fontSize: 10, color: C.accent, fontWeight: '600' }}>
                              {it.selected.length} selecionado{it.selected.length === 1 ? '' : 's'}
                            </Text>
                          </View>

                          <View style={{ gap: 6 }}>
                            {it.suppliers.map(supName => {
                              const s = SUPPLIERS.find(x => x.n === supName);
                              const selected = it.selected.includes(supName);
                              const cons = it.consultancy?.find(c => c.name === supName);

                              return (
                                <View
                                  key={supName}
                                  style={{
                                    borderRadius: 10,
                                    borderWidth: 1.5,
                                    borderColor: selected ? C.accent : C.line2,
                                    backgroundColor: selected ? C.accentSubtle : C.surface,
                                    padding: 10,
                                    gap: 6
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Pressable
                                      onPress={() => toggleChecklistSupplier(analysis.id, it.id, supName)}
                                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                                    >
                                      <View
                                        style={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: 5,
                                          backgroundColor: selected ? C.accent : C.s3,
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {selected && <Icon k="check" s={11} color="#fff" sw={3} />}
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{supName}</Text>
                                        <Text style={{ fontSize: 11, color: C.muted }}>
                                          ★ {s ? rate(s.r) : ''} · {s?.c || ''}
                                        </Text>
                                      </View>
                                    </Pressable>

                                    <Pressable
                                      onPress={() => onOpenProfile(supName)}
                                      hitSlop={8}
                                      style={{ padding: 6, borderRadius: 6, backgroundColor: C.s2 }}
                                    >
                                      <Icon k="eye" s={14} color={C.muted} />
                                    </Pressable>
                                  </View>

                                  {cons && (
                                    <View style={{ gap: 4, paddingTop: 4, borderTopWidth: 1, borderColor: selected ? 'rgba(23,74,64,.12)' : C.line }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <View
                                          style={[
                                            st.pill,
                                            {
                                              backgroundColor: cons.pillar === 'logistica' ? 'rgba(31,122,85,.14)' : C.surface,
                                              borderWidth: 1,
                                              borderColor: cons.pillar === 'logistica' ? C.ok : C.line2
                                            }
                                          ]}
                                        >
                                          <Text
                                            style={{
                                              fontSize: 10,
                                              fontWeight: '700',
                                              color: cons.pillar === 'logistica' ? C.ok : C.text
                                            }}
                                          >
                                            {cons.tag}
                                          </Text>
                                        </View>
                                        {cons.distanceKm && (
                                          <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600' }}>
                                            ~{cons.distanceKm} km da obra
                                          </Text>
                                        )}
                                      </View>
                                      <Text style={{ fontSize: 11, color: C.t2, lineHeight: 15 }}>
                                        {cons.reason}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}

              <Pressable
                onPress={() => {
                  removeAnalysis(analysis.id);
                  setPhase('upload');
                }}
                style={{ alignItems: 'center', paddingVertical: 12 }}
              >
                <Text style={{ fontSize: 12, color: C.warn }}>Descartar este checklist</Text>
              </Pressable>
            </ScrollView>

            {/* Sticky Footer */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                backgroundColor: C.surface,
                borderTopWidth: 1,
                borderColor: C.line,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>
                  {stats.checked} itens · {stats.sups} fornecedores
                </Text>
                <Text style={{ fontSize: 11, color: C.muted }}>
                  {analysis.fileName ? 'O PDF vai anexado nas cotações' : 'Checklist enviado em lote'}
                </Text>
              </View>
              {analysis.quoteId ? (
                <Btn label="Ver cotação" onPress={() => onOpenQuote(analysis.quoteId!)} />
              ) : (
                <Btn
                  label={`Enviar (${stats.sups})`}
                  icon="msg"
                  disabled={stats.sups === 0}
                  onPress={() => {
                    requireAuth(() => {
                      const qid = sendChecklistQuotes(analysis.id);
                      if (qid) {
                        toast('Cotações enviadas!', `${stats.sups} fornecedores receberam o checklist.`);
                      }
                    });
                  }}
                />
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ---------- App Entry ---------- */
export default function App() {
  const [fontsLoaded] = useFonts({
    'SourceSerif4-Regular': require('../assets/fonts/SourceSerif4-Regular.ttf'),
    'SourceSerif4-SemiBold': require('../assets/fonts/SourceSerif4-SemiBold.ttf'),
    'SourceSerif4-Italic': require('../assets/fonts/SourceSerif4-Italic.ttf'),
    'SourceSerif4-SemiBoldItalic': require('../assets/fonts/SourceSerif4-SemiBoldItalic.ttf'),
  });

  const { theme, toggleTheme, authOpen, toasts, conversations } = useStore();
  const C = THEMES[theme];
  const st = useMemo(() => getStyles(C, fontsLoaded), [theme, fontsLoaded]);

  const [tab, setTab] = useState<Tab>('home');
  const [profile, setProfile] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successCheckout, setSuccessCheckout] = useState<{ pay: string; orders: Order[] } | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [obraModalOpen, setObraModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null);
  const [quotesModalOpen, setQuotesModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [projectAiModalOpen, setProjectAiModalOpen] = useState(false);

  const { items } = useOrc();
  const unreadMsgsCount = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);

  const tabs: [Tab, string, string][] = [
    ['home', 'Início', 'home'],
    ['sup', 'Buscar', 'search'],
    ['orc', 'Orçamento', 'orc'],
    ['ped', 'Conta', 'user']
  ];

  return (
    <ThemeContext.Provider value={{ C, st, theme, toggleTheme, fontsLoaded }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style={C.statusBarStyle} />
          
          {/* Top Navbar */}
          <View style={st.top}>
            <View style={st.logo}>
              <View style={st.logoBox}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path fillRule="evenodd" clipRule="evenodd" d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2ZM12 6.5L7.5 9.1V14.9L12 17.5L16.5 14.9V9.1L12 6.5Z" fill="#ffffff" />
                  <Circle cx={12} cy={12} r={1.8} fill="#10b981" />
                </Svg>
              </View>
              <Text style={st.logoText}>OFIR</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => setObraModalOpen(true)} style={st.topObraChip}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.ok }} />
                <Text style={st.topObraText}>Minha obra · 44%</Text>
              </Pressable>
              <Pressable onPress={() => setMessagesModalOpen(true)} style={st.topIconBtn} hitSlop={8}>
                <Icon k="msg" s={20} color={C.text} />
                {unreadMsgsCount > 0 && (
                  <View style={st.topMsgBadge}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadMsgsCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {tab === 'home' && (
              <Home
                go={setTab}
                open={setProfile}
                onOpenAddress={() => setAddressModalOpen(true)}
                onOpenObra={() => setObraModalOpen(true)}
                onOpenProjectAi={() => setProjectAiModalOpen(true)}
              />
            )}
            {tab === 'sup' && (
              <Suppliers
                open={setProfile}
                onOpenAddress={() => setAddressModalOpen(true)}
                onOpenChat={cid => setActiveChatConvId(cid)}
              />
            )}
            {tab === 'orc' && (
              <Orcamento
                goSup={() => setTab('sup')}
                onOpenAddress={() => setAddressModalOpen(true)}
                onOpenCheckout={() => setCheckoutOpen(true)}
              />
            )}
            {tab === 'ped' && (
              <Pedidos
                go={setTab}
                onOpenAddress={() => setAddressModalOpen(true)}
                onOpenObra={() => setObraModalOpen(true)}
                onOpenMessages={() => setMessagesModalOpen(true)}
                onOpenQuotes={() => setQuotesModalOpen(true)}
                onOpenOrder={id => setSelectedOrderId(id)}
                onOpenQuote={id => setSelectedQuoteId(id)}
                onOpenProfile={() => setUserProfileModalOpen(true)}
                onOpenProjectAi={() => setProjectAiModalOpen(true)}
              />
            )}
          </View>

          {toasts.map(t => (
            <View key={t.id} style={st.toast}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t.title}</Text>
              {!!t.text && <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>{t.text}</Text>}
            </View>
          ))}

          <View style={st.tabbar}>
            {tabs.map(([k, l, i]) => (
              <Pressable key={k} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8 }} onPress={() => setTab(k)}>
                <View>
                  <Icon k={i} color={tab === k ? C.accent : C.muted} sw={tab === k ? 2.2 : 1.8} />
                  {k === 'orc' && items.length > 0 && (
                    <View style={st.badge}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{items.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: tab === k ? C.accent : C.muted, fontWeight: tab === k ? '700' : '500' }}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          {profile && (
            <SupplierProfileModal
              name={profile}
              onClose={() => setProfile(null)}
              onOpenChat={convId => setActiveChatConvId(convId)}
            />
          )}
          <AddressManagerModal visible={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
          <CheckoutModal
            visible={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onOpenAddress={() => setAddressModalOpen(true)}
            onSuccess={data => setSuccessCheckout(data)}
          />
          {successCheckout && (
            <OrderSuccessModal
              data={successCheckout}
              onClose={() => setSuccessCheckout(null)}
              onOpenOrder={id => setSelectedOrderId(id)}
              onGoToOrders={() => {
                setSuccessCheckout(null);
                setTab('ped');
              }}
            />
          )}
          {selectedOrderId && (
            <OrderDetailModal
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
              onOpenChat={cid => setActiveChatConvId(cid)}
            />
          )}
          <MinhaObraModal
            visible={obraModalOpen}
            onClose={() => setObraModalOpen(false)}
            onGoToStage={(stage, sysKey) => {
              useStore.getState().setFilters({ seg: 'svc', stage, sys: sysKey || 'all' });
              setTab('sup');
            }}
            onOpenProjectAi={() => setProjectAiModalOpen(true)}
          />
          <MessagesModal
            visible={messagesModalOpen}
            onClose={() => setMessagesModalOpen(false)}
            onOpenChat={cid => setActiveChatConvId(cid)}
            onOpenQuotes={() => setQuotesModalOpen(true)}
          />
          {activeChatConvId && (
            <ChatModal
              convId={activeChatConvId}
              onClose={() => setActiveChatConvId(null)}
              onSuccessPayment={data => {
                setActiveChatConvId(null);
                setSuccessCheckout(data);
              }}
              onOpenAddress={() => setAddressModalOpen(true)}
            />
          )}
          <QuotesModal
            visible={quotesModalOpen}
            onClose={() => setQuotesModalOpen(false)}
            onOpenQuote={qid => setSelectedQuoteId(qid)}
          />
          {selectedQuoteId && (
            <QuoteDetailModal
              quoteId={selectedQuoteId}
              onClose={() => setSelectedQuoteId(null)}
              onOpenChat={cid => setActiveChatConvId(cid)}
            />
          )}
          <UserProfileModal
            visible={userProfileModalOpen}
            onClose={() => setUserProfileModalOpen(false)}
          />
          <ProjectAnalyzerModal
            visible={projectAiModalOpen}
            onClose={() => setProjectAiModalOpen(false)}
            onOpenQuote={qid => {
              setProjectAiModalOpen(false);
              setSelectedQuoteId(qid);
            }}
            onOpenProfile={name => {
              setProfile(name);
            }}
          />
          {authOpen && <Auth />}
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}

/* ---------- Geração Dinâmica de Estilos Baseada no Tema ---------- */
function getStyles(C: ThemeColors, fontsLoaded: boolean) {
  const serifReg = fontsLoaded ? 'SourceSerif4-Regular' : Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
  const serifSemi = fontsLoaded ? 'SourceSerif4-SemiBold' : Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
  const serifItal = fontsLoaded ? 'SourceSerif4-Italic' : Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

  return StyleSheet.create({
    heroTitle: {
      fontFamily: serifReg,
      fontSize: 34,
      lineHeight: 40,
      color: C.text,
      letterSpacing: -0.5,
    },
    heroAccent: {
      fontFamily: serifItal,
      fontStyle: 'italic',
      color: C.accent,
    },
    serifHeading: {
      fontFamily: serifSemi,
      color: C.text,
      letterSpacing: -0.3,
    },
    logoSerif: {
      fontFamily: serifSemi,
      letterSpacing: -0.5,
    },
    logo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: C.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 18.5,
      fontWeight: '800',
      color: C.text,
      letterSpacing: 1.0,
    },
    monoVal: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontSize: 12,
      fontWeight: '700',
      color: C.text,
      letterSpacing: -0.2,
    },
    monoValLarge: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontSize: 15.5,
      fontWeight: '700',
      color: C.text,
      letterSpacing: -0.3,
      marginTop: 2,
    },

    h4: { fontSize: 15, fontWeight: '700', color: C.text },
    muted: { fontSize: 13, color: C.muted },
    t2: { fontSize: 13, color: C.t2 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.accent },
    card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 14 },
    btn: { height: 46, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row', gap: 6 },
    btnSm: { height: 36, alignSelf: 'flex-start' },
    btnGhost: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.accentBorder },
    btnT: { color: '#fff', fontWeight: '600', fontSize: 14 },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 99,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.accentBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },
    chipT: { fontSize: 13, color: C.accent, fontWeight: '600' },
    input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: 14, color: C.text },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface },
    simInput: { height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.14)', color: '#fff', paddingHorizontal: 12, fontSize: 16, fontWeight: '600' },
    simR: { color: '#fff', fontSize: 20, fontWeight: '700' },
    seg: { flex: 1, height: 38, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' },
    segtog: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    qty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line2, borderRadius: 8, backgroundColor: C.surface },
    qBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    role: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface },
    modalHead: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.surface },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.surface },
    tabbar: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, backgroundColor: C.surface },
    badge: { position: 'absolute', top: -4, right: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    toast: { position: 'absolute', left: 16, right: 16, bottom: 72, backgroundColor: C.text, borderRadius: 12, padding: 12 },

    /* Endereço */
    addrBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.s2, borderRadius: 10, borderWidth: 1, borderColor: C.line },
    addrBarText: { fontSize: 12, color: C.t2 },
    addrLine: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.line },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.line2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
    activeBadge: { backgroundColor: C.accentSubtle, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.accentBorder },
    activeBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent },

    /* Ícone de etapa com contorno */
    stageIconBox: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor: C.accentSubtle,
      borderWidth: 1.2,
      borderColor: C.accentBorder,
      alignItems: 'center',
      justifyContent: 'center'
    },

    /* Empty state */
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 56,
      minHeight: 380,
    },
    emptyCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: C.accentSubtle,
      borderWidth: 1.5,
      borderColor: C.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: serifSemi,
      fontSize: 22,
      letterSpacing: -0.3,
      color: C.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 14,
      lineHeight: 21,
      color: C.muted,
      textAlign: 'center',
      maxWidth: 320,
      marginBottom: 20,
    },
    emptyActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* Fornecedor Detalhes estilo Airbnb */
    photoCaptionBox: {
      position: 'absolute',
      left: 14,
      bottom: 14,
      backgroundColor: C.surface,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.line
    },
    photoCaptionTitle: { fontSize: 13, fontWeight: '700', color: C.text },
    photoCaptionSub: { fontSize: 11, color: C.muted },
    photoCounter: {
      position: 'absolute',
      right: 14,
      bottom: 14,
      backgroundColor: 'rgba(0,0,0,.65)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99
    },
    photoCounterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    profileToast: {
      position: 'absolute',
      bottom: 80,
      alignSelf: 'center',
      backgroundColor: C.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      elevation: 4
    },
    bottomBarAirbnb: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderColor: C.line,
    },

    /* Auth */
    pwBox: { position: 'relative', flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface },
    eyeBtn: { position: 'absolute', right: 8, height: 44, width: 36, alignItems: 'center', justifyContent: 'center' },
    appleBtn: { height: 46, borderRadius: 10, backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    appleBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    googleBtn: { height: 46, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    googleG: { fontSize: 16, fontWeight: '700', color: '#ea4335' },
    googleBtnText: { color: C.text, fontSize: 15, fontWeight: '600' },
    orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
    orLine: { flex: 1, height: 1, backgroundColor: C.line },
    orText: { fontSize: 12, color: C.muted },

    /* Top Bar */
    topObraChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: C.accentSubtle,
      borderWidth: 1,
      borderColor: C.accentBorder
    },
    topObraText: { fontSize: 12, fontWeight: '700', color: C.accent },
    topIconBtn: { position: 'relative', padding: 6 },
    topMsgBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: C.warn,
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3
    },

    /* Section Label */
    secLabel: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 4 },

    /* Policy / Escrow notice box */
    policyBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: C.accentSubtle,
      borderWidth: 1,
      borderColor: C.accentBorder
    },
    policyText: { flex: 1, fontSize: 12, lineHeight: 17, color: C.text },

    /* Status Pills */
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: C.s3,
      alignSelf: 'flex-start'
    },
    pillOk: { backgroundColor: 'rgba(31,122,85,.12)' },
    pillText: { fontSize: 11, fontWeight: '700', color: C.t2 },
    pillTextOk: { color: C.ok },

    /* Split breakdown card (Mobile otimizado com distribuição ampla) */
    splitCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.surface,
      padding: 14,
      gap: 10,
    },
    splitCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    splitSupName: {
      fontSize: 14,
      fontWeight: '700',
      color: C.text,
    },
    splitSupSub: {
      fontSize: 11,
      color: C.muted,
      marginTop: 2,
    },
    splitMiniLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: C.muted,
    },
    splitTotalVal: {
      fontSize: 15,
      fontWeight: '700',
      color: C.text,
      marginTop: 2,
    },
    splitDivider: {
      height: 1,
      backgroundColor: C.line,
    },
    splitCardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    splitVal: {
      fontSize: 13.5,
      fontWeight: '700',
      marginTop: 2,
    },

    /* Split table (legado) */
    splitTable: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.surface,
      overflow: 'hidden'
    },
    splitHeadRow: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: C.s2,
      borderBottomWidth: 1,
      borderColor: C.line
    },
    splitHeadCell: { fontSize: 11, fontWeight: '700', color: C.muted },
    splitBodyRow: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: C.line,
      alignItems: 'center'
    },

    /* Timeline step */
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    stepDot: { width: 10, height: 10, borderRadius: 5 },

    /* Chat components */
    chatBubble: {
      maxWidth: '82%',
      padding: 12,
      borderRadius: 14,
      marginVertical: 4
    },
    chatThem: {
      alignSelf: 'flex-start',
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.line,
      borderBottomLeftRadius: 4
    },
    chatMe: {
      alignSelf: 'flex-end',
      backgroundColor: C.accent,
      borderBottomRightRadius: 4
    },
    chatTextThem: { fontSize: 14, color: C.text, lineHeight: 20 },
    chatTextMe: { fontSize: 14, color: '#fff', lineHeight: 20 },
    chatTime: { fontSize: 10, color: C.muted, alignSelf: 'flex-end', marginTop: 4 },
    chatTimeMe: { fontSize: 10, color: 'rgba(255,255,255,.7)', alignSelf: 'flex-end', marginTop: 4 },
    sysMsg: {
      alignSelf: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: C.s3,
      marginVertical: 8
    },
    sysMsgText: { fontSize: 11, color: C.muted, textAlign: 'center', fontWeight: '500' },
    chatComposer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderColor: C.line
    },
    bottomCheckoutBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderColor: C.line,
    },
  });
}
