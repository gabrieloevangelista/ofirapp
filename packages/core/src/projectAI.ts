import { MATS, STAGES, SUPPLIERS, SYSTEMS, type Supplier } from './data';
import { norm, serves } from './logic';

/* =========================================================================
   Análise de projeto arquitetônico com IA (OpenAI GPT)
   - Recebe o arquivo (PDF/imagem) em base64, envia à API da OpenAI (GPT-4o)
     e recebe um checklist estruturado (serviços por etapa + materiais com quantidades).
   - Sem chave de API, gera uma análise simulada a partir dos dados da obra.
   ========================================================================= */

export type ChecklistKind = 'svc' | 'mat';
export type ChecklistPriority = 'alta' | 'media' | 'baixa';

export interface ChecklistItem {
  id: string;
  kind: ChecklistKind;
  /** chave da etapa (STAGES) quando svc, ou da categoria de material (MATS) quando mat */
  cat: string;
  title: string;
  detail: string;
  qty?: number;
  un?: string;
  priority: ChecklistPriority;
  /** 0 a 1 */
  confidence: number;
  /** fornecedores sugeridos (nomes) */
  suppliers: string[];
  /** fornecedores marcados para receber a solicitação */
  selected: string[];
  checked: boolean;
  /** consultoria da IA com pilares de reputação, custo-benefício, logística e qualidade */
  consultancy?: SupplierConsultancy[];
}

export type ConsultancyPillar = 'logistica' | 'custo_beneficio' | 'qualidade' | 'reputacao';

export interface SupplierConsultancy {
  name: string;
  pillar: ConsultancyPillar;
  tag: string;
  reason: string;
  distanceKm: number;
  cityFrom: string;
  rating: number;
  reviewCount: number;
}

export interface ProjectSummary {
  tipo: string;
  area: number;
  pavimentos: number;
  quartos: number;
  banheiros: number;
  sistema: string;
  padrao: string;
  ambientes: string[];
  observacoes: string[];
}

export interface ProjectAnalysis {
  id: string;
  fileName?: string;
  fileSize?: string;
  createdAt: number;
  source: 'gpt' | 'gemini' | 'simulado';
  model?: string;
  summary: ProjectSummary;
  items: ChecklistItem[];
  quoteId?: string;
  sentAt?: number;
}

export interface AnalyzeContext {
  obraName: string;
  area: number;
  systemKey: string;
  systemName: string;
  city: string;
  uf?: string;
}

export interface AnalyzeInput {
  /** PDF ou imagem em base64 (sem o prefixo data:) — opcional: sem arquivo gera checklist pelos dados da obra */
  base64?: string;
  fileName?: string;
  fileSize?: string;
  apiKey?: string;
  model?: string;
  ctx: AnalyzeContext;
  signal?: AbortSignal;
}

export const GPT_DEFAULT_MODEL = 'gpt-4o';
export const OPENAI_DEFAULT_MODEL = 'gpt-4o';
export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
/** limite de tamanho do arquivo em base64 (18 MB), com folga para o prompt */
export const MAX_PDF_BYTES = 18 * 1024 * 1024;

export const STAGE_ORDER = ['projeto', 'terreno', 'fundacao', 'estrutura', 'cobertura', 'instalacoes', 'esquadrias', 'acabamento', 'paisagismo', 'posobra'];
const MAT_KEYS = MATS.map(m => m[0]);
const STAGE_KEYS = STAGES.map(s => s[0]);
const ALL_CATS = [...STAGE_KEYS, ...MAT_KEYS];

export const fmtBytes = (b: number) =>
  b >= 1024 * 1024 ? (b / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

export const catLabel = (cat: string) =>
  (STAGES.find(s => s[0] === cat) || MATS.find(m => m[0] === cat) || [cat, cat])[1];

/** tenta identificar o sistema construtivo citado no projeto */
export function guessSystemKey(text: string, fallback: string): string {
  const t = norm(text || '');
  if (!t) return fallback;
  if (t.includes('eps') || t.includes('monolit')) return 'eps';
  if (t.includes('steel')) return 'steel';
  if (t.includes('wood')) return 'wood';
  if (t.includes('metalic') || t.includes('metalica') || t.includes('estrutura metalica') || t.includes('aco')) return 'metalica';
  if (t.includes('turnkey') || t.includes('chave na mao') || t.includes('acabada')) return 'acabada';
  if (t.includes('pvc')) return 'concretopvc';
  if (t.includes('pre-mold') || t.includes('premold') || t.includes('pre mold')) return 'premoldado';
  if (t.includes('estrutural')) return 'bloco';
  if (t.includes('alvenaria') || t.includes('concreto armado') || t.includes('tijolo')) return 'alvenaria';
  return fallback;
}

const CITY_DISTANCES: Record<string, Record<string, number>> = {
  atibaia: { atibaia: 8, 'braganca paulista': 24, jundiai: 38, campinas: 58, 'sao paulo': 64, 'santo andre': 82, sorocaba: 110, 'ribeirao preto': 280, curitiba: 450 },
  campinas: { campinas: 8, atibaia: 58, jundiai: 39, 'braganca paulista': 62, 'sao paulo': 95, sorocaba: 88, 'ribeirao preto': 225, curitiba: 470 },
  'sao paulo': { 'sao paulo': 10, 'santo andre': 18, atibaia: 64, jundiai: 55, campinas: 95, 'braganca paulista': 85, sorocaba: 98, 'ribeirao preto': 310, curitiba: 410 },
  jundiai: { jundiai: 8, atibaia: 38, campinas: 39, 'sao paulo': 55, 'braganca paulista': 52, sorocaba: 80, 'ribeirao preto': 260, curitiba: 440 },
  'braganca paulista': { 'braganca paulista': 8, atibaia: 24, jundiai: 52, campinas: 62, 'sao paulo': 85, sorocaba: 130, 'ribeirao preto': 270, curitiba: 475 },
};

export function estimateDeliveryDistance(fromCityRaw: string, toCityRaw: string): number {
  const f = norm((fromCityRaw || '').split(',')[0].trim());
  const t = norm((toCityRaw || '').split(',')[0].trim());
  if (f === t || (f && t && (f.includes(t) || t.includes(f)))) return 8;
  const known = CITY_DISTANCES[t]?.[f] || CITY_DISTANCES[f]?.[t];
  if (known) return known;
  if (f.includes('curitiba') || t.includes('curitiba')) return 440;
  if (f.includes('ribeirao') || t.includes('ribeirao')) return 260;
  return 55;
}

export function buildSupplierConsultancy(x: Supplier, obraCity: string, cat: string, idx: number): SupplierConsultancy {
  const dist = estimateDeliveryDistance(x.c, obraCity);
  const isLocal = dist <= 18;
  const isHighRep = x.r >= 4.9 && x.a >= 100;
  const isHighValue = x.kind === 'mat' || (x.frete !== undefined && x.frete <= 150);

  let pillar: ConsultancyPillar;
  let tag: string;
  let reason: string;

  if (isLocal) {
    pillar = 'logistica';
    tag = `Mais próximo da obra (${dist} km)`;
    reason = `Sede em ${x.c.split(',')[0]} (~${dist} km) · menor frete logístico, entrega rápida e equipe próxima para visita.`;
  } else if (isHighRep && idx === 1) {
    pillar = 'reputacao';
    tag = `Maior reputação (${x.r.toFixed(1).replace('.', ',')} estrelas)`;
    reason = `Nota ${x.r.toFixed(1).replace('.', ',')} com ${x.a} contratos concluídos · referência de pontualidade e vistoria sem atrasos.`;
  } else if (isHighValue || idx === 2) {
    pillar = 'custo_beneficio';
    tag = `Melhor custo-benefício`;
    reason = `Volume competitivo e frete econômico para a região · alta pontuação em eficiência de custo.`;
  } else {
    pillar = 'qualidade';
    tag = `Excelência técnica`;
    reason = `Especialista técnico em ${catLabel(cat)} com garantia de responsabilidade técnica e conformidade.`;
  }

  return {
    name: x.n,
    pillar,
    tag,
    reason,
    distanceKm: dist,
    cityFrom: x.c.split(',')[0],
    rating: x.r,
    reviewCount: x.a
  };
}

/** fornecedores da plataforma que atendem a categoria, priorizando cidade, sistema e avaliação */
export function suggestSuppliersFor(cat: string, kind: ChecklistKind, city: string, sysKey: string): string[] {
  const list = SUPPLIERS.filter(x => (x.cats.includes(cat) || x.e === cat) && (kind === 'mat' ? x.kind === 'mat' : true));
  const scored = list
    .map(x => {
      const dist = estimateDeliveryDistance(x.c, city);
      const isServes = serves(x, city);
      const distBonus = dist <= 15 ? 40 : dist <= 40 ? 25 : dist <= 70 ? 10 : 0;
      const sysBonus = x.s === sysKey ? 50 : x.s === 'all' ? 10 : 0;
      return {
        x,
        dist,
        score: (isServes ? 100 : 0) + sysBonus + distBonus + x.r * 15 + Math.min(x.a, 300) / 10
      };
    })
    .sort((a, b) => b.score - a.score);

  const final = scored.length ? scored : list.map(x => ({ x, dist: 50, score: x.r }));
  return final.slice(0, 3).map(s => s.x.n);
}

function defaultSelected(names: string[], city: string): string[] {
  const ok = names.filter(n => {
    const x = SUPPLIERS.find(s => s.n === n);
    return x ? serves(x, city) : false;
  });
  return (ok.length ? ok : names).slice(0, 2);
}

interface RawItem {
  kind?: string;
  cat?: string;
  title?: string;
  detail?: string;
  qty?: number;
  un?: string;
  priority?: string;
  confidence?: number;
}
interface RawAnalysis {
  isProject?: boolean;
  summary?: Partial<ProjectSummary>;
  items?: RawItem[];
}

let seq = 1;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** valida e normaliza a resposta (da IA ou simulada), mapeando fornecedores da plataforma */
export function normalizeAnalysis(raw: RawAnalysis, input: AnalyzeInput, source: ProjectAnalysis['source']): ProjectAnalysis {
  const { ctx } = input;
  const s = raw.summary || {};
  const sysKey = guessSystemKey(String(s.sistema || ''), ctx.systemKey);
  const summary: ProjectSummary = {
    tipo: String(s.tipo || ctx.obraName || 'Residência'),
    area: Number(s.area) > 0 ? Math.round(Number(s.area)) : ctx.area,
    pavimentos: Math.max(1, Math.round(Number(s.pavimentos) || 1)),
    quartos: Math.max(0, Math.round(Number(s.quartos) || 0)),
    banheiros: Math.max(0, Math.round(Number(s.banheiros) || 0)),
    sistema: String(s.sistema || ctx.systemName || ''),
    padrao: String(s.padrao || 'Médio'),
    ambientes: Array.isArray(s.ambientes) ? s.ambientes.map(String).slice(0, 16) : [],
    observacoes: Array.isArray(s.observacoes) ? s.observacoes.map(String).slice(0, 6) : []
  };

  const seen = new Set<string>();
  const items: ChecklistItem[] = (raw.items || [])
    .filter(it => it && it.cat && ALL_CATS.includes(String(it.cat)) && it.title)
    .map(it => {
      const cat = String(it.cat);
      const kind: ChecklistKind = MAT_KEYS.includes(cat) ? 'mat' : 'svc';
      const suppliers = suggestSuppliersFor(cat, kind, ctx.city, sysKey);
      const consultancy = suppliers.map((supName, idx) => {
        const x = SUPPLIERS.find(s => s.n === supName);
        return x ? buildSupplierConsultancy(x, ctx.city, cat, idx) : null;
      }).filter(Boolean) as SupplierConsultancy[];
      const priority: ChecklistPriority = it.priority === 'alta' || it.priority === 'baixa' ? it.priority : 'media';
      const qty = Number(it.qty);
      return {
        id: uid('ck'),
        kind,
        cat,
        title: String(it.title).slice(0, 80),
        detail: String(it.detail || '').slice(0, 220),
        qty: qty > 0 ? Math.round(qty * 10) / 10 : undefined,
        un: it.un ? String(it.un).slice(0, 12) : undefined,
        priority,
        confidence: Math.max(0, Math.min(1, Number(it.confidence) || 0.6)),
        suppliers,
        selected: defaultSelected(suppliers, ctx.city),
        checked: suppliers.length > 0,
        consultancy
      };
    })
    .filter(it => {
      const k = it.kind + it.cat + norm(it.title);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'svc' ? -1 : 1;
      const oa = a.kind === 'svc' ? STAGE_ORDER.indexOf(a.cat) : MAT_KEYS.indexOf(a.cat);
      const ob = b.kind === 'svc' ? STAGE_ORDER.indexOf(b.cat) : MAT_KEYS.indexOf(b.cat);
      return oa - ob;
    });

  return {
    id: uid('pa'),
    fileName: input.fileName,
    fileSize: input.fileSize,
    createdAt: Date.now(),
    source,
    model: source === 'gpt' ? input.model || GPT_DEFAULT_MODEL : source === 'gemini' ? input.model || GEMINI_DEFAULT_MODEL : undefined,
    summary,
    items
  };
}

/* ---------- Prompt e schema do GPT / OpenAI ---------- */
function buildPrompt(ctx: AnalyzeContext) {
  return [
    'Você é um engenheiro civil orçamentista brasileiro com experiência em obras residenciais.',
    'Analise o projeto arquitetônico anexado (plantas, cortes, fachadas, quadro de áreas, memorial) e monte um CHECKLIST do que o proprietário precisa contratar e comprar para executar a obra, para que a plataforma envie pedidos de orçamento aos fornecedores.',
    '',
    `Dados informados pelo proprietário: obra "${ctx.obraName}", ${ctx.area} m², sistema construtivo pretendido: ${ctx.systemName}, cidade: ${ctx.city}${ctx.uf ? '/' + ctx.uf : ''}.`,
    '',
    'Regras:',
    `- Serviços (kind="svc") devem usar apenas estas categorias em "cat": ${STAGES.map(s => `${s[0]} (${s[1]})`).join('; ')}.`,
    `- Materiais (kind="mat") devem usar apenas estas categorias em "cat": ${MATS.map(m => `${m[0]} (${m[1]})`).join('; ')}.`,
    '- Pode haver mais de um item por categoria (ex.: instalação elétrica e instalação hidráulica).',
    '- Estime quantidades (qty + un) a partir das áreas, ambientes, cotas e esquadrias do projeto. Para serviços use un como "m²", "m", "un" ou "vb" (verba). Para materiais use unidades comerciais (m³, saco, barra, m², rolo, peça, lata).',
    '- Se uma informação não estiver legível, estime pela área informada e reduza "confidence" (0 a 1).',
    '- "title" curto (até 60 caracteres). "detail" explica o que foi identificado no projeto que justifica o item (até 160 caracteres).',
    '- "priority": "alta" para o caminho crítico do início da obra (sondagem, fundação, estrutura), "media" para o meio e "baixa" para itens finais.',
    '- Não inclua "projeto" se o arquivo já é um projeto completo, exceto aprovação na prefeitura ou projetos complementares ausentes (estrutural, elétrico, hidráulico).',
    '- Em "summary" resuma o projeto (tipo, área total construída, pavimentos, quartos, banheiros, sistema construtivo indicado, padrão de acabamento, lista de ambientes e observações relevantes para orçamento).',
    '- Se o arquivo claramente não for um projeto de construção, retorne isProject=false e items vazio.',
    '- Responda sempre em português do Brasil no formato JSON estrito.'
  ].join('\n');
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isProject: { type: 'BOOLEAN' },
    summary: {
      type: 'OBJECT',
      properties: {
        tipo: { type: 'STRING' },
        area: { type: 'NUMBER' },
        pavimentos: { type: 'INTEGER' },
        quartos: { type: 'INTEGER' },
        banheiros: { type: 'INTEGER' },
        sistema: { type: 'STRING' },
        padrao: { type: 'STRING' },
        ambientes: { type: 'ARRAY', items: { type: 'STRING' } },
        observacoes: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['tipo', 'area', 'pavimentos', 'quartos', 'banheiros', 'sistema', 'padrao', 'ambientes', 'observacoes']
    },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          kind: { type: 'STRING', enum: ['svc', 'mat'] },
          cat: { type: 'STRING', enum: ALL_CATS },
          title: { type: 'STRING' },
          detail: { type: 'STRING' },
          qty: { type: 'NUMBER' },
          un: { type: 'STRING' },
          priority: { type: 'STRING', enum: ['alta', 'media', 'baixa'] },
          confidence: { type: 'NUMBER' }
        },
        required: ['kind', 'cat', 'title', 'detail', 'priority', 'confidence']
      }
    }
  },
  required: ['isProject', 'summary', 'items']
};

export class ProjectAIError extends Error {
  code: 'not_project' | 'api' | 'network' | 'parse' | 'too_large';
  constructor(code: ProjectAIError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export async function callOpenAI(input: AnalyzeInput): Promise<RawAnalysis> {
  const model = input.model || GPT_DEFAULT_MODEL;
  const url = 'https://api.openai.com/v1/chat/completions';
  const isImage = input.fileName && /\.(png|jpe?g|webp|gif)$/i.test(input.fileName);

  const contentParts: any[] = [
    { type: 'text', text: buildPrompt(input.ctx) }
  ];

  if (input.base64) {
    if (isImage) {
      const ext = input.fileName?.toLowerCase().split('.').pop() || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${input.base64}` }
      });
    } else {
      contentParts.push({
        type: 'file',
        file: {
          file_data: `data:application/pdf;base64,${input.base64}`,
          filename: input.fileName || 'projeto.pdf'
        }
      });
    }
  }

  const systemInstructions = [
    'Você é um engenheiro civil orçamentista sênior brasileiro, especialista em métodos construtivos modernos (EPS, Steel Frame, Wood Frame, Drywall) e orçamentação precisa de obras.',
    'Analise as pranchas e dados fornecidos e monte um CHECKLIST detalhado.',
    'Retorne OBRIGATORIAMENTE um objeto JSON válido seguindo a estrutura: {"isProject": boolean, "summary": {...}, "items": [...]}'
  ].join('\n');

  const body = {
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: contentParts }
    ]
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${input.apiKey}`
      },
      body: JSON.stringify(body),
      signal: input.signal
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new ProjectAIError('network', 'Não foi possível conectar à API da OpenAI (GPT). Verifique sua conexão.');
  }

  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `Erro ${res.status} ao analisar o projeto com GPT.`;
    throw new ProjectAIError('api', msg);
  }

  const rawText: string = json?.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(rawText.replace(/^```json\s*|```$/g, '').trim());
  } catch {
    throw new ProjectAIError('parse', 'O GPT retornou uma resposta que não pôde ser interpretada como JSON. Tente novamente.');
  }
}

export const callGPT = callOpenAI;

export async function callGemini(input: AnalyzeInput): Promise<RawAnalysis> {
  const model = input.model || GEMINI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: input.base64 } },
          { text: buildPrompt(input.ctx) }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': input.apiKey! },
      body: JSON.stringify(body),
      signal: input.signal
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new ProjectAIError('network', 'Não foi possível conectar ao serviço de IA. Verifique sua conexão.');
  }

  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `Erro ${res.status} ao analisar o projeto.`;
    throw new ProjectAIError('api', msg);
  }
  const text: string = (json?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
  try {
    return JSON.parse(text.replace(/^```json\s*|```$/g, '').trim());
  } catch {
    throw new ProjectAIError('parse', 'A IA retornou uma resposta inválida. Tente novamente.');
  }
}

/* ---------- Análise simulada (sem chave de API ou sem arquivo) ---------- */
export function buildSimulatedRaw(ctx: AnalyzeContext): RawAnalysis {
  const a = Math.max(40, ctx.area || 120);
  const quartos = Math.max(1, Math.min(6, Math.round(a / 100)));
  const banheiros = quartos + 1;
  const sys = SYSTEMS.find(s => s.k === ctx.systemKey);
  const perim = Math.round(Math.sqrt(a) * 4.4);
  const walls = Math.round(a * 2.6);
  const ceil = (v: number) => Math.max(1, Math.ceil(v));

  const items: RawItem[] = [
    { kind: 'svc', cat: 'projeto', title: 'Projetos complementares (estrutural, elétrico e hidráulico)', detail: 'Necessários para cotação precisa de fundação, estrutura e instalações.', qty: a, un: 'm²', priority: 'alta', confidence: 0.7 },
    { kind: 'svc', cat: 'terreno', title: 'Sondagem de solo SPT', detail: 'Define o tipo de fundação a partir da capacidade de carga do terreno.', qty: 3, un: 'furos', priority: 'alta', confidence: 0.85 },
    { kind: 'svc', cat: 'terreno', title: 'Terraplenagem e nivelamento do lote', detail: `Platô para a projeção da casa (~${Math.round(a * 1.3)} m²) e acessos.`, qty: Math.round(a * 1.3), un: 'm²', priority: 'alta', confidence: 0.6 },
    { kind: 'svc', cat: 'fundacao', title: a > 250 ? 'Fundação em radier' : 'Sapatas e vigas baldrame', detail: 'Indicado para casa térrea com cargas distribuídas; confirmar após sondagem.', qty: a, un: 'm²', priority: 'alta', confidence: 0.65 },
    { kind: 'svc', cat: 'estrutura', title: sys ? `Estrutura e vedação em ${sys.n}` : 'Estrutura e vedação', detail: `Paredes externas (~${perim} m lineares) e divisórias internas conforme planta.`, qty: walls, un: 'm²', priority: 'alta', confidence: 0.7 },
    { kind: 'svc', cat: 'cobertura', title: 'Cobertura com telha termoacústica e calhas', detail: `Área de cobertura estimada com beirais de 80 cm (~${Math.round(a * 1.18)} m²).`, qty: Math.round(a * 1.18), un: 'm²', priority: 'media', confidence: 0.65 },
    { kind: 'svc', cat: 'instalacoes', title: 'Instalação elétrica completa', detail: `${quartos} quartos, ${banheiros} banheiros, cozinha e áreas sociais; quadro e circuitos dedicados.`, qty: a, un: 'm²', priority: 'media', confidence: 0.7 },
    { kind: 'svc', cat: 'instalacoes', title: 'Instalação hidráulica e sanitária', detail: `${banheiros} banheiros, cozinha e área de serviço; água fria, quente e esgoto.`, qty: banheiros + 2, un: 'pontos', priority: 'media', confidence: 0.7 },
    { kind: 'svc', cat: 'esquadrias', title: 'Esquadrias de alumínio e vidro', detail: 'Janelas e portas externas conforme quadro de esquadrias da planta.', qty: Math.round(a * 0.14), un: 'm²', priority: 'media', confidence: 0.55 },
    { kind: 'svc', cat: 'acabamento', title: 'Assentamento de porcelanato', detail: 'Pisos internos e áreas molhadas, com paginação.', qty: Math.round(a * 1.05), un: 'm²', priority: 'baixa', confidence: 0.7 },
    { kind: 'svc', cat: 'acabamento', title: 'Pintura interna e externa', detail: 'Massa, selador e duas demãos de tinta acrílica.', qty: walls * 2, un: 'm²', priority: 'baixa', confidence: 0.65 },
    { kind: 'svc', cat: 'paisagismo', title: 'Paisagismo e jardim', detail: 'Áreas permeáveis e recuos indicados na implantação.', qty: Math.round(a * 0.4), un: 'm²', priority: 'baixa', confidence: 0.5 },
    { kind: 'svc', cat: 'posobra', title: 'Limpeza pós-obra e vistoria de entrega', detail: 'Limpeza fina e checklist técnico antes da mudança.', qty: a, un: 'm²', priority: 'baixa', confidence: 0.8 },
    { kind: 'mat', cat: 'cimento', title: 'Concreto usinado fck 25', detail: 'Fundação e contrapiso.', qty: ceil(a * 0.12), un: 'm³', priority: 'alta', confidence: 0.6 },
    { kind: 'mat', cat: 'cimento', title: 'Cimento CP-II 50 kg', detail: 'Argamassas de assentamento e reboco.', qty: ceil(a * 0.35), un: 'saco', priority: 'media', confidence: 0.55 },
    { kind: 'mat', cat: 'ferragem', title: 'Vergalhão CA-50 10 mm', detail: 'Armação de fundação e vigas.', qty: ceil(a * 0.3), un: 'barra', priority: 'alta', confidence: 0.55 },
    { kind: 'mat', cat: 'eletrica', title: 'Cabo flexível 2,5 mm (rolo 100 m)', detail: 'Circuitos de tomadas de uso geral.', qty: ceil(a / 45), un: 'rolo', priority: 'media', confidence: 0.6 },
    { kind: 'mat', cat: 'hidraulica', title: 'Tubo PVC soldável 25 mm', detail: 'Rede de água fria.', qty: ceil(a / 8), un: 'barra', priority: 'media', confidence: 0.55 },
    { kind: 'mat', cat: 'vidros', title: 'Vidro temperado 10 mm', detail: 'Box dos banheiros e guarda-corpos.', qty: banheiros * 3, un: 'm²', priority: 'baixa', confidence: 0.5 },
    { kind: 'mat', cat: 'revestimentos', title: 'Porcelanato 120x120 acetinado', detail: 'Área de piso + 10% de perda.', qty: Math.round(a * 1.1), un: 'm²', priority: 'baixa', confidence: 0.65 },
    { kind: 'mat', cat: 'loucas', title: 'Bacias com caixa acoplada', detail: `Uma por banheiro (${banheiros}).`, qty: banheiros, un: 'peça', priority: 'baixa', confidence: 0.8 },
    { kind: 'mat', cat: 'tintas', title: 'Tinta acrílica premium 18 L', detail: 'Paredes internas e externas, duas demãos.', qty: ceil((walls * 2) / 90), un: 'lata', priority: 'baixa', confidence: 0.6 }
  ];

  return {
    isProject: true,
    summary: {
      tipo: ctx.obraName || 'Residência',
      area: a,
      pavimentos: 1,
      quartos,
      banheiros,
      sistema: sys?.n || ctx.systemName,
      padrao: 'Alto',
      ambientes: ['Estar e jantar', 'Cozinha', 'Área de serviço', ...Array.from({ length: quartos }, (_, i) => (i === 0 ? 'Suíte master' : `Suíte ${i + 1}`)), 'Lavabo', 'Garagem'],
      observacoes: [
        'Checklist estimado pelos dados da obra (análise simulada).',
        'Quantidades são referência: os fornecedores confirmam no orçamento.'
      ]
    },
    items
  };
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => {
      clearTimeout(t);
      const err: any = new Error('Aborted');
      err.name = 'AbortError';
      reject(err);
    });
  });

/** ponto de entrada: usa o GPT quando há arquivo + chave; senão, análise simulada */
export async function analyzeProject(input: AnalyzeInput): Promise<ProjectAnalysis> {
  if (input.base64 && input.apiKey) {
    const isGeminiKey = input.apiKey.startsWith('AIza');
    const isGeminiModel = input.model?.includes('gemini');
    const useGemini = isGeminiKey || isGeminiModel;

    const raw = useGemini ? await callGemini(input) : await callOpenAI(input);
    const source: 'gpt' | 'gemini' = useGemini ? 'gemini' : 'gpt';

    if (raw.isProject === false) {
      throw new ProjectAIError('not_project', 'O arquivo enviado não parece ser um projeto arquitetônico. Envie as plantas da obra em PDF ou imagem.');
    }
    const result = normalizeAnalysis(raw, input, source);
    if (!result.items.length) {
      throw new ProjectAIError('parse', 'A IA não conseguiu identificar itens no projeto. Tente um arquivo com as plantas legíveis.');
    }
    return result;
  }
  await wait(2600, input.signal);
  return normalizeAnalysis(buildSimulatedRaw(input.ctx), input, 'simulado');
}
