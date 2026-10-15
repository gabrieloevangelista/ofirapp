export type Kind = 'svc' | 'mat';

export interface Product { n: string; un: string; p: number; def: number }
export interface Supplier {
  i: number; n: string; e: string; s: string; c: string; r: number; a: number; t: string; m: string;
  kind: Kind; cats: string[]; frete?: number; prazo?: string; prods?: Product[];
  atende: string[]; raio: number;
}
export interface System { k: string; n: string; d: string; t: string[]; c: number; p: number; f: number; m: string }
export interface Plan { n: string; a: number; q: number; b: number; s: string; rooms: [number, number, number, number, string][] }

export const ICONS: Record<string, string> = {
  projeto: 'M3 3h18v18H3zM3 12h9V3M12 12v9',
  terreno: 'M2 20h20M4 20l5-8 4 5 3-4 4 7',
  fundacao: 'M3 14h18v6H3zM7 14V8M12 14V5M17 14V8',
  estrutura: 'M4 21V9l8-5 8 5v12M4 13h16M4 17h16M9 21V9M15 21V9',
  cobertura: 'M2 12 12 4l10 8M5 10v10h14V10',
  instalacoes: 'M13 2 4 14h7l-1 8 9-12h-7z',
  esquadrias: 'M4 3h16v18H4zM12 3v18M4 12h16',
  acabamento: 'M4 4h12v5H4zM16 6h3v6h-8v3M10 15h2v6h-2z',
  paisagismo: 'M12 22V11M12 11c-4 0-7-3-7-7 4 0 7 3 7 7zM12 14c4 0 7-3 7-7-4 0-7 3-7 7z',
  posobra: 'M3 21h18M6 21V10l6-6 6 6v11M9 15l2 2 4-4',
  madeira: 'M3 6h18M3 12h18M3 18h18M7 6v6M15 12v6',
  ferragem: 'M4 20 20 4M4 14l6 6M10 4l10 10',
  cimento: 'M6 3h12l2 18H4zM8 9h8',
  eletrica: 'M13 2 4 14h7l-1 8 9-12h-7z',
  hidraulica: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  revestimentos: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  loucas: 'M4 10h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM12 10V5h4',
  tintas: 'M4 4h12v6H4zM16 7h3v6h-8v3M10 16h2v5h-2z',
  vidros: 'M4 3h16v18H4zM8 9l4-4M8 14l8-8',
  search: 'M4 11a7 7 0 1 0 14 0 7 7 0 0 0-14 0M20 20l-3.5-3.5',
  pin: 'M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12zM9.5 9a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0',
  orc: 'M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 4V3h6v1M9 10h6M9 14h6M9 18h3',
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  user: 'M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21c0-4 4-6 8-6s8 2 8 6',
  msg: 'M4 4h16v12H5.2L4 17.2z',
  shield: 'M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6zM9 12l2 2 4-4',
  star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  x: 'M6 6l12 12M18 6 6 18',
  back: 'm15 18-6-6 6-6',
  next: 'm9 18 6-6-6-6',
  check: 'M5 12l5 5 9-10',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  medal: 'M12 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 9 6 3h4l2 4 2-4h4l-2.5 6',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 15l2 2 4-4',
  helmet: 'M3 17h18M5 17v-3a7 7 0 0 1 14 0v3M12 7V4M9 7.5V5.5M15 7.5V5.5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0',
  eyeOff: 'M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20',
  apple: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.06-1.82.94-2.88-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.75-.95 2.79 1.02.08 2.05-.52 2.68-1.28z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  clip: 'm21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v8h4ZM18 9h2a2 2 0 0 1 2 2v11h-4ZM10 6h4M10 10h4M10 14h4M10 18h4',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
  checkDouble: 'm18 6-9 9-4-4M22 10l-7.5 7.5M8 17l-2-2',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  bulb: 'M9 18h6m-4 4h2m-5-8.5a7 7 0 1 1 8 0c-.9.9-1.5 2-1.5 3.5H9.5c0-1.5-.6-2.6-1.5-3.5z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
};

export const MATS: [string, string][] = [
  ['cimento','Cimento e agregados'],
  ['ferragem','Ferragem e aço'],
  ['madeira','Madeira e chapas'],
  ['eletrica','Material elétrico'],
  ['hidraulica','Material hidráulico'],
  ['vidros','Vidros'],
  ['revestimentos','Revestimentos'],
  ['loucas','Louças e metais'],
  ['tintas','Tintas'],
];
export const STAGES: [string, string][] = [
  ['terreno','Sondagem de solo e terraplenagem'],
  ['fundacao','Fundação'],
  ['estrutura','Vedação e estrutura (EPS / Steel frame)'],
  ['cobertura','Cobertura e telhado'],
  ['instalacoes','Elétrica e hidráulica'],
  ['esquadrias','Portas e esquadrias'],
  ['acabamento','Revestimento e acabamento'],
  ['projeto','Projeto e aprovação'],
  ['paisagismo','Paisagismo'],
  ['posobra','Limpeza e pós-obra'],
];
export const STAGE_COUNT: Record<string, number> = { terreno:48, fundacao:96, estrutura:388, cobertura:132, instalacoes:241, esquadrias:118, acabamento:305, projeto:214, paisagismo:67, posobra:74 };

export const SYSTEMS: System[] = [
  { k:'eps', n:'Painel Monolítico (EPS)', d:'Painéis de isopor com malha de aço, revestidos com argamassa projetada.', t:['Mais procurado','Isolamento térmico','70% mais rápido'], c:.92, p:.30, f:480, m:'m9' },
  { k:'steel', n:'Steel frame', d:'Perfis de aço galvanizado com fechamento em placas, montagem a seco.', t:['Montagem a seco','50% menos tempo industrializado'], c:1.08, p:.50, f:312, m:'m3' },
  { k:'wood', n:'Wood frame', d:'Estrutura de madeira tratada de reflorestamento com placas OSB.', t:['Montagem a seco','Processo industrializado'], c:1.05, p:.50, f:94, m:'m6' },
  { k:'alvenaria', n:'Alvenaria convencional', d:'Tijolo ou bloco cerâmico com estrutura de concreto armado.', t:['Mão de obra fácil de achar','Reformas simples'], c:1, p:1, f:1240, m:'m1' },
  { k:'bloco', n:'Alvenaria estrutural', d:'Blocos que funcionam como estrutura, dispensando vigas e pilares.', t:['Menos concreto','Ideal para repetição'], c:.94, p:.75, f:420, m:'m4' },
  { k:'premoldado', n:'Pré-moldado', d:'Peças de concreto fabricadas fora e montadas na obra com guindaste.', t:['Galpões e grandes vãos','Montagem industrializada rápida'], c:.97, p:.55, f:136, m:'m5' },
];

type Raw = Omit<Supplier, 'i' | 'atende' | 'raio' | 'kind' | 'cats'> & { kind?: Kind; cats?: string[] };
const RAW: Raw[] = [
  // 1. Sondagem de solo e terraplenagem
  { n:'Terra Plana Terraplenagem', e:'terreno', s:'all', c:'Jundiaí, SP', r:4.7, a:88, t:'4h', m:'m4' },
  // 2. Fundação
  { n:'Base Forte Fundações', e:'fundacao', s:'all', c:'Campinas, SP', r:4.9, a:128, t:'2h', m:'m1' },
  { n:'Sólida Engenharia', e:'fundacao', s:'all', c:'Atibaia, SP', r:4.8, a:64, t:'3h', m:'m6' },
  // 3. Vedação e Estrutura (Painel Monolítico EPS, Steel Frame, etc)
  { n:'Painel Monolítico EPS', e:'estrutura', s:'eps', c:'São Paulo, SP', r:4.9, a:198, t:'1h', m:'m9' },
  { n:'Aço Leve Construções', e:'estrutura', s:'steel', c:'Sorocaba, SP', r:4.7, a:143, t:'2h', m:'m3' },
  { n:'Madeira Certa Wood Frame', e:'estrutura', s:'wood', c:'Curitiba, PR', r:4.9, a:51, t:'5h', m:'m6' },
  { n:'Bloco Certo Construtora', e:'estrutura', s:'bloco', c:'Campinas, SP', r:4.7, a:110, t:'3h', m:'m4' },
  { n:'Pré-Mold Galpões', e:'estrutura', s:'premoldado', c:'Ribeirão Preto, SP', r:4.6, a:76, t:'6h', m:'m5' },
  // 4. Cobertura e Telhado
  { n:'Telhados Serra Azul', e:'cobertura', s:'all', c:'Bragança Paulista, SP', r:4.8, a:92, t:'2h', m:'m5' },
  // 5. Instalações
  { n:'Hidrolar Instalações', e:'instalacoes', s:'all', c:'São Paulo, SP', r:4.6, a:187, t:'1h', m:'m8' },
  // 6. Esquadrias e vidros
  { n:'Vidraçaria Horizonte', e:'esquadrias', s:'all', c:'Santo André, SP', r:4.7, a:73, t:'3h', m:'m3', cats:['esquadrias','vidros'], frete:150, prazo:'7 dias úteis', prods:[{ n:'Vidro temperado 10 mm incolor', un:'m²', p:340, def:30 },{ n:'Vidro laminado 8 mm', un:'m²', p:395, def:12 }] },
  // 7. Acabamentos (por último no ciclo da obra)
  { n:'Revest Pisos e Acabamentos', e:'acabamento', s:'all', c:'Campinas, SP', r:4.8, a:154, t:'2h', m:'m2' },
  // Projeto e complementares
  { n:'Traço Arquitetura', e:'projeto', s:'all', c:'São Paulo, SP', r:4.9, a:212, t:'1h', m:'m9' },
  { n:'Verde Vivo Paisagismo', e:'paisagismo', s:'all', c:'Atibaia, SP', r:4.9, a:41, t:'4h', m:'m7' },
  { n:'Brilho Limpeza Pós-Obra', e:'posobra', s:'all', c:'Campinas, SP', r:4.9, a:173, t:'1h', m:'m7' },
  { n:'Vistoria Certa Engenharia', e:'posobra', s:'all', c:'São Paulo, SP', r:4.8, a:66, t:'3h', m:'m3' },
  // Produtos e Materiais na mesma sequência de aplicação
  { n:'Concremix Materiais', e:'cimento', kind:'mat', cats:['cimento'], s:'all', c:'Jundiaí, SP', r:4.6, a:301, t:'1h', m:'m9', frete:260, prazo:'2 dias úteis', prods:[{ n:'Concreto usinado fck 25', un:'m³', p:520, def:40 },{ n:'Cimento CP-II 50 kg', un:'saco', p:38.9, def:120 },{ n:'Areia média', un:'m³', p:165, def:15 },{ n:'Brita 1', un:'m³', p:178, def:12 }] },
  { n:'Ferro e Aço Distribuidora', e:'ferragem', kind:'mat', cats:['ferragem'], s:'all', c:'Campinas, SP', r:4.7, a:212, t:'2h', m:'m3', frete:220, prazo:'3 dias úteis', prods:[{ n:'Vergalhão CA-50 10 mm (barra 12 m)', un:'barra', p:58.9, def:60 },{ n:'Vergalhão CA-50 8 mm (barra 12 m)', un:'barra', p:39.5, def:80 },{ n:'Arame recozido 18', un:'kg', p:21, def:20 },{ n:'Tela soldada 15x15 cm', un:'painel', p:142, def:30 }] },
  { n:'Madeireira Serra Verde', e:'madeira', kind:'mat', cats:['madeira','cobertura'], s:'all', c:'Atibaia, SP', r:4.8, a:164, t:'1h', m:'m6', frete:180, prazo:'2 dias úteis', prods:[{ n:'Chapa OSB 18 mm', un:'chapa', p:129, def:20 },{ n:'Viga de eucalipto tratado 6 m', un:'peça', p:189, def:12 },{ n:'Caibro de pinus 5x6 cm', un:'m', p:14.9, def:80 },{ n:'Tábua de pinus 30 cm', un:'m', p:22, def:40 }] },
  { n:'Elétrica Total', e:'eletrica', kind:'mat', cats:['eletrica'], s:'all', c:'São Paulo, SP', r:4.7, a:188, t:'2h', m:'m5', frete:90, prazo:'2 dias úteis', prods:[{ n:'Cabo flexível 2,5 mm (rolo 100 m)', un:'rolo', p:289, def:10 },{ n:'Disjuntor DIN 20 A', un:'peça', p:24, def:30 },{ n:'Quadro de distribuição 24 disjuntores', un:'peça', p:189, def:2 }] },
  { n:'Hidro Center', e:'hidraulica', kind:'mat', cats:['hidraulica'], s:'all', c:'Campinas, SP', r:4.6, a:142, t:'3h', m:'m8', frete:110, prazo:'3 dias úteis', prods:[{ n:'Tubo PVC soldável 25 mm (barra 6 m)', un:'barra', p:28, def:40 },{ n:'Caixa d’água 1.000 L', un:'peça', p:489, def:2 },{ n:'Registro de gaveta 3/4"', un:'peça', p:79, def:12 }] },
  { n:'Casa do Porcelanato', e:'revestimentos', kind:'mat', cats:['revestimentos'], s:'all', c:'Campinas, SP', r:4.9, a:236, t:'1h', m:'m2', frete:250, prazo:'5 dias úteis', prods:[{ n:'Porcelanato 120x120 acetinado', un:'m²', p:189, def:320 },{ n:'Argamassa AC-III 20 kg', un:'saco', p:49, def:80 },{ n:'Rejunte acrílico 5 kg', un:'balde', p:39, def:20 }] },
  { n:'Metais e Louças Prime', e:'loucas', kind:'mat', cats:['loucas'], s:'all', c:'São Paulo, SP', r:4.8, a:97, t:'2h', m:'m9', frete:120, prazo:'4 dias úteis', prods:[{ n:'Bacia com caixa acoplada', un:'peça', p:1290, def:5 },{ n:'Cuba de apoio em louça', un:'peça', p:489, def:6 },{ n:'Misturador monocomando', un:'peça', p:890, def:6 }] },
  { n:'Tintas Horizonte', e:'tintas', kind:'mat', cats:['tintas'], s:'all', c:'Bragança Paulista, SP', r:4.7, a:121, t:'2h', m:'m4', frete:80, prazo:'2 dias úteis', prods:[{ n:'Tinta acrílica premium 18 L', un:'lata', p:489, def:14 },{ n:'Massa corrida 25 kg', un:'saco', p:119, def:20 },{ n:'Selador acrílico 18 L', un:'lata', p:189, def:6 }] },
];

export const REG: Record<string, string[]> = {
  sp: ['São Paulo','Santo André','São Bernardo do Campo','Guarulhos','Osasco','Barueri'],
  camp: ['Campinas','Valinhos','Vinhedo','Indaiatuba','Jundiaí','Atibaia','Bragança Paulista'],
  soro: ['Sorocaba','Itu','Votorantim','Salto'],
  rp: ['Ribeirão Preto','Sertãozinho','Jardinópolis'],
  cwb: ['Curitiba','São José dos Pinhais','Colombo','Pinhais'],
};
const ATENDE: Record<string, string[]> = {'Traço Arquitetura':['sp','camp'],'Terra Plana Terraplenagem':['camp','sp'],'Base Forte Fundações':['camp'],'Sólida Engenharia':['camp','sp'],'Painel Monolítico EPS':['sp','camp'],'Aço Leve Construções':['soro','sp','camp'],'Madeira Certa Wood Frame':['cwb'],'Pré-Mold Galpões':['rp','camp'],'Bloco Certo Construtora':['camp'],'Telhados Serra Azul':['camp'],'Hidrolar Instalações':['sp'],'Vidraçaria Horizonte':['sp'],'Revest Pisos e Acabamentos':['camp'],'Verde Vivo Paisagismo':['camp','sp'],'Madeireira Serra Verde':['camp','sp'],'Ferro e Aço Distribuidora':['camp','sp'],'Concremix Materiais':['camp','sp'],'Elétrica Total':['sp','camp'],'Hidro Center':['camp'],'Casa do Porcelanato':['camp','sp'],'Metais e Louças Prime':['sp','camp'],'Tintas Horizonte':['camp'],'Brilho Limpeza Pós-Obra':['camp','sp'],'Vistoria Certa Engenharia':['sp','camp']};

export const SUPPLIERS: Supplier[] = RAW.map((x, i) => ({
  ...x, i,
  cats: x.cats || [x.e],
  kind: x.kind || 'svc',
  atende: [...new Set((ATENDE[x.n] || []).flatMap(r => REG[r]))],
  raio: 60 + (ATENDE[x.n] || []).length * 50,
}));

export const PLANS: Plan[] = [
  { n:'Casa térrea 4 suítes', a:420, q:4, b:5, s:'Alvenaria ou EPS', rooms:[[0,0,40,30,'Estar e jantar'],[40,0,30,30,'Cozinha'],[0,30,25,30,'Suíte'],[25,30,20,30,'Lavabo'],[45,30,25,30,'Suíte master']] },
  { n:'Casa de campo 3 suítes', a:290, q:3, b:4, s:'Todos os sistemas', rooms:[[0,0,45,28,'Estar e varanda'],[45,0,25,28,'Cozinha'],[0,28,24,32,'Suíte master'],[24,28,14,16,'Banho'],[24,44,14,16,'Banho'],[38,28,16,32,'Suíte'],[54,28,16,32,'Suíte']] },
  { n:'Sobrado contemporâneo', a:380, q:4, b:5, s:'Alvenaria estrutural', rooms:[[0,0,35,60,'Térreo social'],[35,0,35,25,'Suíte'],[35,25,20,15,'Banho'],[55,25,15,15,'Escada'],[35,40,35,20,'Suíte master']] },
  { n:'Kitnets para renda, 4 un.', a:120, q:4, b:4, s:'EPS ou steel frame', rooms:[[0,0,35,30,'Kit 1'],[35,0,35,30,'Kit 2'],[0,30,35,30,'Kit 3'],[35,30,35,30,'Kit 4']] },
];

export const MEDIA: Record<string, [string, string]> = {
  m1: ['#ebe4d8', '#cfc3ae'], m2: ['#eee8de', '#d6c9b3'], m3: ['#e6e7e8', '#c3c6c9'],
  m4: ['#ece2da', '#cbb2a1'], m5: ['#e3e7ec', '#b8c2ce'], m6: ['#eee5d6', '#ccb698'],
  m7: ['#e5e9e1', '#bbc5b2'], m8: ['#e1e8e5', '#b2c3bc'], m9: ['#f0eee9', '#d5d1c7'],
};

export const PLATFORM_FEE = 0.03;

export const DESC: Record<string, string> = {
  projeto:'Escritório de arquitetura focado em residências de alto padrão. Desenvolve o projeto completo, do estudo preliminar ao executivo, e cuida da aprovação na prefeitura e no condomínio.',
  terreno:'Empresa de terraplenagem e preparo de terreno com frota própria. Faz levantamento, corte, aterro, compactação e contenções para deixar o lote pronto para a fundação.',
  fundacao:'Engenharia de fundações para residências e pequenos edifícios. Trabalha com radier, sapatas, estacas e blocos, sempre a partir de sondagem e projeto estrutural.',
  estrutura:'Execução de estrutura e vedação com equipe própria e responsável técnico em todas as obras. Entrega cronograma por etapa e relatório semanal com fotos.',
  cobertura:'Telhados e coberturas para residências: estrutura de madeira ou metálica, telhas cerâmicas, de concreto ou termoacústicas, calhas e impermeabilização.',
  instalacoes:'Projetos e execução de instalações elétricas, hidráulicas e de automação, com laudos e testes de estanqueidade entregues no final.',
  esquadrias:'Fabricação e instalação de esquadrias de alumínio e vidro sob medida, com linha própria para grandes vãos e portas de correr.',
  acabamento:'Revestimentos, pisos, pintura e acabamentos finos. Equipe especializada em porcelanato de grande formato e paginação conforme projeto.',
  paisagismo:'Projeto e execução de paisagismo residencial, irrigação automatizada e iluminação de jardim, com manutenção após a entrega.',
  posobra:'Limpeza técnica pós-obra e vistoria de entrega. Remoção de resíduos de cimento, tinta e rejunte, limpeza de vidros e esquadrias e checklist final do imóvel.',
  madeira:'Madeireira com madeira tratada de reflorestamento, estruturas para telhado e chapas. Também executa coberturas em madeira com equipe própria.',
  ferragem:'Distribuidora de aço para construção: vergalhões, telas, arames e corte e dobra conforme projeto estrutural.',
  cimento:'Materiais básicos e concreto usinado com entrega programada por etapa da obra.',
  eletrica:'Material elétrico de linha residencial e predial, com conferência de lista a partir do projeto.',
  hidraulica:'Tubos, conexões, reservatórios e registros, com separação de pedido por ambiente.',
  revestimentos:'Porcelanatos de grande formato, argamassas e rejuntes, com cálculo de quantidade e perda pelo projeto.',
  loucas:'Louças, metais e acessórios de banheiro e cozinha das principais linhas de alto padrão.',
  tintas:'Tintas, massas e seladores, com mistura de cores e entrega programada.',
  vidros:'Vidros temperados e laminados sob medida.'
};

export const SPEC: Record<string, string[]> = {
  projeto:['Residencial alto padrão','Projeto executivo','Aprovação legal','Interiores'],
  terreno:['Corte e aterro','Contenções','Drenagem','Topografia'],
  fundacao:['Radier','Estacas','Sapatas','Sondagem SPT'],
  estrutura:['Cronograma por etapa','Relatório semanal','Equipe própria'],
  cobertura:['Telha cerâmica','Termoacústica','Impermeabilização'],
  instalacoes:['Elétrica','Hidráulica','Automação','Laudos'],
  esquadrias:['Alumínio','Vidro temperado','Grandes vãos'],
  acabamento:['Porcelanato','Pintura','Gesso e forro'],
  paisagismo:['Projeto paisagístico','Irrigação','Iluminação'],
  posobra:['Limpeza fina','Vidros e esquadrias','Vistoria de entrega'],
  madeira:['Madeira tratada','Estrutura de telhado','Chapas OSB'],
  ferragem:['Vergalhões','Corte e dobra','Telas'],
  cimento:['Concreto usinado','Entrega programada'],
  eletrica:['Cabos','Disjuntores','Quadros'],
  hidraulica:['PVC','Reservatórios','Registros'],
  revestimentos:['Grande formato','Argamassas'],
  loucas:['Louças','Metais'],
  tintas:['Acrílicas','Massas'],
  vidros:['Temperado','Laminado']
};

export interface ServiceItem { n: string; d: string; u?: string; p?: number; days?: number; quote?: boolean }
export const SVCS: Record<string, ServiceItem[]> = {
  terreno:[{n:'Sondagem de solo SPT',d:'Furos de sondagem e laudo técnico com capacidade de carga',u:'fixo',p:4800,days:5},{n:'Terraplenagem e nivelamento',d:'Corte, aterro, nivelamento e compactação',quote:true},{n:'Levantamento topográfico',d:'Planialtimétrico cadastral com curvas de nível',u:'fixo',p:3200,days:7},{n:'Limpeza de terreno',d:'Remoção de vegetação e entulho',u:'fixo',p:4500,days:5}],
  fundacao:[{n:'Fundação em radier',d:'Armação, fôrmas, concreto usinado e nivelamento',quote:true},{n:'Estacas e blocos de fundação',d:'Perfuração, armação e concretagem',quote:true},{n:'Sapatas e vigas baldrame',d:'Escavação, vigas baldrame e impermeabilização',quote:true}],
  estrutura:[{n:'Painel Monolítico (EPS) com vedação',d:'Montagem estrutural em painéis EPS com argamassa projetada (70% mais rápido)',quote:true},{n:'Steel frame e vedação termoacústica',d:'Estrutura metálica industrializada e placas cimentícias',quote:true},{n:'Alvenaria estrutural e convencional',d:'Execução de alvenaria com blocos e lajes',quote:true},{n:'Visita técnica e dimensionamento',d:'Análise do projeto executivo e do terreno',u:'fixo',p:1500,days:3}],
  cobertura:[{n:'Cobertura e telhado completo',d:'Estrutura, telhas termoacústicas ou cerâmicas e calhas',quote:true},{n:'Impermeabilização de laje e telhado',d:'Manta asfáltica, rufos e drenagem',u:'m²',p:65,days:10},{n:'Revisão e manutenção de telhado',d:'Inspeção, troca de peças e calhas',u:'fixo',p:2400,days:3}],
  instalacoes:[{n:'Projeto elétrico e hidráulico',d:'Com memorial e ART',u:'m²',p:28,days:30},{n:'Instalação elétrica completa',d:'Quadros, circuitos e pontos',u:'m²',p:150,days:35},{n:'Instalação hidráulica e sanitária',d:'Tubulações, esgoto e caixas',quote:true}],
  esquadrias:[{n:'Medição técnica',d:'Levantamento de vãos na obra',u:'fixo',p:900,days:2},{n:'Esquadrias de alumínio e vidro',d:'Fabricação e instalação sob medida',quote:true}],
  acabamento:[{n:'Assentamento de porcelanato e pisos',d:'Mão de obra fina com paginação',u:'m²',p:85,days:30},{n:'Pintura completa e acabamento fino',d:'Massa, lixa e demãos com tinta premium',u:'m²',p:48,days:25},{n:'Gesso e forro drywall',d:'Rebaixamento e acabamento',u:'m²',p:75,days:15}],
  projeto:[{n:'Projeto arquitetônico completo',d:'Plantas, cortes, fachadas e memorial descritivo',u:'m²',p:95,days:45},{n:'Aprovação na prefeitura',d:'Protocolo, acompanhamento e alvará',u:'fixo',p:6800,days:60},{n:'Projeto de interiores',d:'Layout, marcenaria e iluminação',u:'m²',p:70,days:40}],
  posobra:[{n:'Limpeza pós-obra',d:'Limpeza fina de pisos, vidros, esquadrias e louças',u:'m²',p:9,days:4},{n:'Limpeza de vidros e esquadrias',d:'Remoção de resíduos e película',u:'fixo',p:1800,days:2},{n:'Vistoria de entrega',d:'Checklist técnico com laudo e fotos',u:'fixo',p:2400,days:3}],
  paisagismo:[{n:'Projeto paisagístico',d:'Planta, espécies e memorial',u:'fixo',p:9500,days:30},{n:'Implantação de jardim e irrigação',d:'Plantio, irrigação e iluminação',quote:true}]
};

export const RV_NAMES = ['Fernanda A.','Ricardo L.','Patrícia M.','Eduardo S.','Camila R.','Marcelo T.','Juliana P.','André V.'];
export const RV_TXT = [
  (s: string) => `Contratamos para a ${s} da nossa casa e o trabalho foi muito bem organizado. Cumpriram o cronograma e mantiveram a obra limpa.`,
  (s: string) => `Atendimento técnico de verdade. Explicaram cada decisão da ${s} e mandaram fotos de todas as etapas antes de pedir a liberação do pagamento.`,
  (s: string) => `Equipe pontual e cuidadosa. Tivemos um ajuste no projeto no meio do caminho e resolveram sem custo escondido.`,
  (s: string) => `Já é a segunda obra que fazemos com eles. Qualidade consistente e comunicação clara pelo chat da plataforma.`,
  (s: string) => `Orçamento detalhado por etapa, sem surpresas. A ${s} ficou exatamente como no projeto.`
];
export const RV_DATES = ['setembro de 2026','agosto de 2026','julho de 2026','maio de 2026','março de 2026'];
export const RV_OBRAS = ['Casa térrea · 420 m²','Sobrado · 380 m²','Casa de campo · 290 m²','Residência · 510 m²','Casa térrea · 350 m²'];
export const PH_NAMES = ['Residência Alto da Serra','Casa Jardim das Palmeiras','Residência Vale Verde','Casa das Pedras','Residência Lago Sul','Sobrado Vila Nova','Casa Pátio Interno'];
export const RESP = ['Eng. Carlos Mendes','Eng. Renata Prado','Eng. Paulo Arantes','Eng. Luísa Fontes'];
export const MEDIA_KEYS = ['m1','m9','m3','m6','m7','m4','m8','m2','m5'];

export interface SupplierDetails {
  since: number; anos: number; obras: number; joined: number;
  desc: string; spec: string[];
  awards: { t: string; s: string; ic: string }[];
  svcs: ServiceItem[];
  resp: string; reg: string;
  photos: { t: string; m: string; c: string; y: number }[];
  reviews: { n: string; txt: string; d: string; o: string; r: number }[];
  bars: [string, number][];
}

const detCache: Record<string, SupplierDetails> = {};
export function getSupplierDetails(x: Supplier): SupplierDetails {
  if (detCache[x.n]) return detCache[x.n];
  const i = x.i, uf = x.c.split(', ')[1] || 'SP', stage = (STAGES.find(s=>s[0]===x.e)?.[1] || x.e).toLowerCase();
  const since = 2006 + (i * 3) % 14;
  const awards: { t: string; s: string; ic: string }[] = [];
  if (x.r >= 4.8) awards.push({ ic: 'trophy', t: 'Destaque OFIR 2025', s: 'Entre os mais bem avaliados da região' });
  if (x.a >= 100) awards.push({ ic: 'medal', t: `${x.a} avaliações verificadas`, s: 'Todas de contratos pagos pela plataforma' });
  awards.push({ ic: 'doc', t: 'Documentação conferida', s: 'CNPJ, certidões e registro técnico em dia' });
  if (x.e !== 'projeto' && x.kind !== 'mat') awards.push({ ic: 'helmet', t: 'Equipe com NR-18 e NR-35', s: 'Treinamentos de segurança em dia' });
  if (i % 2 === 0) awards.push({ ic: 'shield', t: 'Seguro de responsabilidade civil', s: 'Cobertura para danos durante a obra' });

  return detCache[x.n] = {
    since, anos: 2026 - since, obras: 60 + i * 19, joined: 2023 + (i % 3),
    desc: DESC[x.e] || 'Especialista em construção civil.',
    spec: (x.s !== 'all' ? [SYSTEMS.find(s=>s.k===x.s)?.n || x.s] : []).concat(SPEC[x.e] || []),
    awards: awards.slice(0, 4),
    svcs: x.cats.flatMap(c => SVCS[c] || []).map(v => ({ ...v })),
    resp: x.kind === 'mat' ? ['Marcos Ribeiro', 'Sandra Lopes', 'Diego Antunes'][i % 3] : x.e === 'projeto' ? 'Arq. Helena Duarte' : RESP[i % RESP.length],
    reg: x.kind === 'mat' ? 'Consultor técnico de vendas' : x.e === 'projeto' ? `CAU-${uf} ativo` : `CREA-${uf} ativo`,
    photos: PH_NAMES.map((t, k) => ({ t, m: MEDIA_KEYS[(i + k) % MEDIA_KEYS.length], c: x.atende[k % x.atende.length] || x.c.split(',')[0], y: 2026 - (k % 4) })),
    reviews: [0, 1, 2, 3].map(k => ({ n: RV_NAMES[(i + k) % RV_NAMES.length], txt: RV_TXT[(i + k) % RV_TXT.length](stage), d: RV_DATES[k], o: RV_OBRAS[(i + k) % RV_OBRAS.length], r: k === 2 && x.r < 4.8 ? 4 : 5 })),
    bars: [['Qualidade', x.r], ['Prazo', Math.max(4.4, x.r - 0.1)], ['Comunicação', Math.min(5, x.r + 0.1)], ['Limpeza da obra', Math.max(4.3, x.r - 0.2)]]
  };
}
