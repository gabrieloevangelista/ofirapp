export interface UFItem {
  uf: string;
  name: string;
  region: string;
}

export const BRAZIL_UFS: UFItem[] = [
  { uf: 'AC', name: 'Acre', region: 'Norte' },
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { uf: 'AP', name: 'Amapá', region: 'Norte' },
  { uf: 'AM', name: 'Amazonas', region: 'Norte' },
  { uf: 'BA', name: 'Bahia', region: 'Nordeste' },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste' },
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { uf: 'PA', name: 'Pará', region: 'Norte' },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { uf: 'PR', name: 'Paraná', region: 'Sul' },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste' },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { uf: 'RO', name: 'Rondônia', region: 'Norte' },
  { uf: 'RR', name: 'Roraima', region: 'Norte' },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { uf: 'TO', name: 'Tocantins', region: 'Norte' },
];

export const TOP_CITIES_BY_UF: Record<string, string[]> = {
  SP: [
    'Atibaia', 'São Paulo', 'Campinas', 'Jundiaí', 'Bragança Paulista',
    'São José dos Campos', 'Sorocaba', 'Ribeirão Preto', 'Santos',
    'São Bernardo do Campo', 'Santo André', 'Osasco', 'Guarulhos',
    'Piracicaba', 'Bauru', 'Barueri', 'Indaiatuba', 'Itatiba',
    'Vinhedo', 'Valinhos', 'Americana', 'Limeira', 'Mogi das Cruzes',
    'Taubaté', 'Praia Grande', 'Cotia', 'Santana de Parnaíba', 'Jarinu',
    'Mairiporã', 'Nazaré Paulista', 'Bom Jesus dos Perdões', 'Piracaia'
  ],
  RJ: [
    'Rio de Janeiro', 'Niterói', 'Petrópolis', 'Volta Redonda', 'Duque de Caxias',
    'Nova Iguaçu', 'Campos dos Goytacazes', 'Cabo Frio', 'Teresópolis', 'Macaé',
    'Angra dos Reis', 'Resende', 'Nova Friburgo', 'Maricá', 'Itaboraí'
  ],
  MG: [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Poços de Caldas',
    'Pouso Alegre', 'Extrema', 'Divinópolis', 'Sete Lagoas', 'Varginha'
  ],
  PR: [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá'
  ],
  SC: [
    'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó',
    'Itajaí', 'Criciúma', 'Jaraguá do Sul', 'Palhoça', 'Balneário Camboriú'
  ],
  RS: [
    'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Passo Fundo'
  ],
  BA: [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
    'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas'
  ],
  DF: [
    'Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Águas Claras',
    'Guará', 'Gama', 'Sobradinho', 'Planaltina'
  ],
  GO: [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
    'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Itumbiara'
  ],
  ES: [
    'Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim',
    'Linhares', 'Colatina', 'Guarapari', 'São Mateus', 'Aracruz'
  ],
  PE: [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
    'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns'
  ],
  CE: [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu'
  ],
  PA: [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas',
    'Castanhal', 'Abaetetuba', 'Cametá', 'Barcarena'
  ],
  MT: [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste'
  ],
  MS: [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Sidrolândia'
  ],
  AM: [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tefé'
  ],
  RN: [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Ceará-Mirim', 'Caicó'
  ],
  PB: [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa'
  ],
  AL: [
    'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares'
  ],
  SE: [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão'
  ],
  PI: [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior'
  ],
  MA: [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó'
  ],
  RO: [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura'
  ],
  TO: [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins'
  ],
  AC: [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó'
  ],
  AP: [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande'
  ],
  RR: [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Cantá', 'Mucajaí'
  ]
};

const citiesCache = new Map<string, string[]>();

/**
 * Busca a lista de municípios para a UF selecionada usando a API do IBGE,
 * com cache em memória e fallback seguro para as principais cidades.
 */
export async function fetchCitiesByUf(uf: string): Promise<string[]> {
  const cleanUf = uf.toUpperCase().trim();
  if (!cleanUf) return [];

  if (citiesCache.has(cleanUf)) {
    return citiesCache.get(cleanUf)!;
  }

  const fallback = TOP_CITIES_BY_UF[cleanUf] || [];

  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${cleanUf}/municipios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Array<{ nome: string }> = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const sorted = data.map(m => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      citiesCache.set(cleanUf, sorted);
      return sorted;
    }
  } catch (err) {
    console.warn(`[OFIR] Fallback de cidades para UF ${cleanUf}:`, err);
  }

  // Preenche cache com fallback
  if (fallback.length > 0) {
    citiesCache.set(cleanUf, fallback);
  }
  return fallback;
}
