/**
 * OFIR / BuyBuild - Estrutura de Conformidade Jurídica e Normativa Brasileira
 * Baseada no ordenamento jurídico nacional (Legislação Federal / Planalto / ctresb/leis):
 * - Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD)
 * - Lei nº 12.965/2014 (Marco Civil da Internet)
 * - Lei nº 8.078/1990 (Código de Defesa do Consumidor - CDC)
 * - Decreto nº 7.962/2013 (Comércio Eletrônico)
 * - Lei nº 10.406/2002 (Código Civil - Contratos de Empreitada)
 * - Lei nº 4.591/1964 e ABNT NBR 12.721 (CUB e Incorporações)
 * - Lei nº 5.194/1966 e Lei nº 6.496/1977 (Exercício da Engenharia e ART/RRT)
 */

export interface LegalArticle {
  law: string;
  article: string;
  topic: string;
  summary: string;
  fullText: string;
}

export interface LegalPillar {
  id: string;
  title: string;
  shortTitle: string;
  lawRef: string;
  icon: string;
  description: string;
  obligations: string[];
}

export const LEGAL_PILLARS: LegalPillar[] = [
  {
    id: 'lgpd',
    title: 'Privacidade e Proteção de Dados Pessoais',
    shortTitle: 'LGPD',
    lawRef: 'Lei Federal nº 13.709/2018',
    icon: 'shield',
    description: 'Tratamento transparente, seguro e fundamentado dos dados pessoais de proprietários de obras e prestadores de serviços.',
    obligations: [
      'Consentimento expresso e inequívoco para coleta de dados de cadastro, obra e contato (Arts. 7º e 8º).',
      'Exercício integral dos direitos do titular: confirmação, acesso, correção, anonimização, exclusão e portabilidade (Art. 18).',
      'Finalidade estrita e legítima voltada à intermediação de orçamentos, cotações e contratos de construção.',
      'Encarregado de Proteção de Dados (DPO) acessível via privacidade@ofir.com.br (Art. 41).'
    ]
  },
  {
    id: 'cdc',
    title: 'Direitos do Consumidor e Orçamento Prévio',
    shortTitle: 'Código de Defesa do Consumidor (CDC)',
    lawRef: 'Lei Federal nº 8.078/1990 e Decreto nº 7.962/2013',
    icon: 'doc',
    description: 'Transparência nas relações de consumo, orçamentos formais vinculantes e proteção contratual no comércio eletrônico.',
    obligations: [
      'Orçamento prévio discriminando material, mão de obra, condições de pagamento e prazos de início e conclusão (Art. 40, caput).',
      'Validade legal garantida da proposta comercial pelo prazo de 10 dias, salvo estipulação expressa em contrário (Art. 40, § 2º).',
      'Vinculação contratual: uma vez aprovado pelo consumidor, o orçamento obriga os contraentes (Art. 40, § 3º).',
      'Direito de arrependimento em até 7 dias para contratações eletrônicas e compras remotas (Art. 49 e Dec. 7.962/2013).'
    ]
  },
  {
    id: 'empreitada',
    title: 'Garantia Legal da Obra e Contratos de Empreitada',
    shortTitle: 'Código Civil Brasileiro',
    lawRef: 'Lei Federal nº 10.406/2002 (Arts. 610 a 626)',
    icon: 'building',
    description: 'Segurança jurídica, definição de responsabilidades e garantia legal irredutível de 5 anos para obras e serviços.',
    obligations: [
      'Garantia legal irredutível de 5 anos pela solidez e segurança da construção civil, tanto por falha de materiais quanto de execução ou solo (Art. 618).',
      'Preço fechado e imutabilidade unilateral: o empreiteiro a preço fixo não pode exigir acréscimos sem alteração acordada de escopo (Art. 619).',
      'Direito de fiscalização e medição permanente da obra pelo proprietário contratante (Art. 615).'
    ]
  },
  {
    id: 'engenharia',
    title: 'Habilitação Profissional e Responsabilidade Técnica',
    shortTitle: 'CREA / CAU / ART',
    lawRef: 'Lei Federal nº 5.194/1966 e Lei nº 6.496/1977',
    icon: 'tool',
    description: 'Exigência de engenheiros e arquitetos legalmente habilitados com emissão de ART ou RRT para todas as obras.',
    obligations: [
      'Obrigatoriedade de Anotação de Responsabilidade Técnica (ART no CREA) ou RRT (no CAU) para projetos e execução.',
      'Validação de registro e certidões de regularidade profissional dos responsáveis técnicos cadastrados na plataforma.',
      'Fiscalização contra o exercício ilegal da profissão em obras e reformas.'
    ]
  },
  {
    id: 'cub',
    title: 'Metodologia Paramétrica e Normas Técnicas CUB',
    shortTitle: 'CUB / NBR 12.721',
    lawRef: 'Lei Federal nº 4.591/1964 e ABNT NBR 12.721',
    icon: 'sparkles',
    description: 'Cálculo de custos referenciais de construção civil alinhados aos dados oficiais dos Sinduscons estaduais.',
    obligations: [
      'Transparência na distinção entre CUB puro (materiais e mão de obra de padrão normativo) e custo real global de obra.',
      'Inclusão clara de despesas não cobertas pelo CUB em obras de alto padrão e ultra luxo (automação, fundações, projetos e climatização).'
    ]
  },
  {
    id: 'internet',
    title: 'Marco Civil da Internet e Segurança de Informações',
    shortTitle: 'Marco Civil da Internet',
    lawRef: 'Lei Federal nº 12.965/2014',
    icon: 'globe',
    description: 'Garantia de segurança, inviolabilidade de comunicações comerciais e preservação de registros.',
    obligations: [
      'Inviolabilidade e sigilo de mensagens comerciais e projetos compartilhados entre clientes e fornecedores (Art. 7º).',
      'Guarda segura de registros de acesso a aplicações de internet em ambiente protegido (Art. 15).'
    ]
  }
];

export const TERMS_OF_USE_TEXT = `
# Termos de Uso da Plataforma OFIR (BuyBuild)
**Última atualização:** Outubro de 2026 · Em estrita conformidade com o ordenamento jurídico da República Federativa do Brasil.

---

### 1. Objeto e Natureza dos Serviços
A **OFIR** é uma plataforma digital de tecnologia que intermedeia o contato, a cotação e a contratação de fornecedores, engenheiros, arquitetos e empreiteiros especializados na construção civil unifamiliar e corporativa.

### 2. Normas de Contratação e Orçamento (Código de Defesa do Consumidor - Lei nº 8.078/1990)
2.1. Conforme estabelece o **Art. 40 da Lei nº 8.078/1990 (CDC)**, todo fornecedor credenciado é obrigado a fornecer orçamento prévio detalhado, com especificação dos materiais, valores unitários, mão de obra e cronograma físico-financeiro.
2.2. **Validade das Propostas:** Salvo estipulação expressa em contrário no corpo da proposta, todo orçamento emitido na OFIR possui validade legal garantida de **10 (dez) dias** a contar do seu envio, em conformidade com o Art. 40, § 2º do CDC.
2.3. **Vinculação e Segurança:** Uma vez aprovado e contratado pelo cliente, o orçamento obriga ambas as partes e somente poderá ser alterado por aditivo bilateral formalizado na plataforma (Art. 40, § 3º do CDC).

### 3. Responsabilidade Técnica e Garantia da Obra (Código Civil - Lei nº 10.406/2002)
3.1. **Garantia Legal de 5 Anos:** Conforme disposto no **Art. 618 do Código Civil Brasileiro**, o empreiteiro e o fornecedor de serviços e materiais respondem, durante o prazo irredutível de **5 (cinco) anos**, pela solidez e segurança dos trabalhos executados, em razão tanto dos materiais empregados quanto do solo.
3.2. **Anotação de Responsabilidade Técnica (ART/RRT):** Todas as etapas estruturais, complementares e de execução devem conter a respectiva ART junto ao CREA (Lei nº 6.496/1977) ou RRT junto ao CAU (Lei nº 12.378/2010), emitida pelo responsável técnico legalmente habilitado.
3.3. **Preço e Escopo Fechado:** Conforme o **Art. 619 do Código Civil**, o empreiteiro a preço fixo não tem direito de exigir aumento de valores em virtude de variações salariais ou de insumos, salvo se houver alteração formal de projeto solicitada pelo proprietário.

### 4. Pagamento Protegido e Custódia de Etapas
4.1. Para assegurar o cumprimento recíproco das obrigações contratuais, a OFIR adota a modalidade de pagamento em conta de custódia protegida, na qual os valores contratados para cada etapa somente são liberados ao fornecedor após a validação e aprovação expressa do proprietário contratante.
4.2. **Direito de Arrependimento e Cancelamento:** Conforme o **Art. 49 do CDC e o Decreto nº 7.962/2013**, em compras eletrônicas e contratações digitais, assiste ao cliente o direito de arrependimento em até 7 (sete) dias corridos a partir da formalização ou pedido, com restituição integral de valores em caso de desistência antes do início da execução ou mobilização de insumos sob medida.

### 5. Foro e Legislação Aplicável
Estes Termos são regidos exclusivamente pela legislação da República Federativa do Brasil. As partes elegem o foro da Comarca do domicílio do consumidor ou do local da obra para dirimir eventuais litígios.
`;

export const PRIVACY_POLICY_TEXT = `
# Política de Privacidade e Proteção de Dados (LGPD)
**Plataforma OFIR (BuyBuild)** · Em conformidade com a Lei Federal nº 13.709/2018 (LGPD) e Lei Federal nº 12.965/2014 (Marco Civil da Internet).

---

### 1. Compromisso com a Privacidade
A OFIR respeita a sua privacidade e garante a segurança, integridade e confidencialidade de todos os dados pessoais coletados durante o uso de nossa plataforma, de acordo com as bases legais estabelecidas pelo **Art. 7º da LGPD**.

### 2. Dados Coletados e Finalidade do Tratamento
* **Dados de Cadastro do Usuário (Art. 7º, I e V da LGPD):** Nome completo, e-mail, telefone/WhatsApp, CPF/CNPJ, necessários para a criação de conta, comunicação e formalização de propostas comerciais.
* **Dados da Obra e Localização:** Endereço da obra, metragem, sistema construtivo e plantas arquitetônicas, estritamente utilizados para permitir o cálculo de orçamentos, cotações com fornecedores da região e medição de etapas.
* **Dados de Navegação e Conexão (Art. 15 do Marco Civil da Internet):** Endereço IP, data e hora de acesso, para fins de segurança, auditoria e cumprimento de obrigação legal.

### 3. Compartilhamento Restrito e Legítimo
Seus dados de contato e projeto são compartilhados **exclusivamente com os fornecedores e profissionais que você selecionar para receber cotações ou contratar**, sendo expressamente vedada a comercialização de dados pessoais para terceiros ou uso para fins não autorizados.

### 4. Direitos do Titular de Dados Pessoais (Art. 18 da LGPD)
Você, como titular de dados, possui o direito de solicitar a qualquer momento:
1. **Confirmação e Acesso:** Saber quais dados pessoais estão sendo tratados.
2. **Correção:** Retificar dados incompletos, inexatos ou desatualizados.
3. **Anonimização ou Bloqueio:** Para dados desnecessários ou tratados em desconformidade.
4. **Eliminação:** Excluir dados tratados com base no seu consentimento (salvo prazos de guarda legal exigidos pelo Código Civil e Código Tributário Nacional).
5. **Portabilidade:** Exportar seus dados em formato estruturado.
6. **Revogação do Consentimento:** Retirar sua autorização de forma simples e gratuita.

### 5. Encarregado pelo Tratamento de Dados (DPO)
Em conformidade com o **Art. 41 da Lei nº 13.709/2018**, a OFIR disponibiliza um canal direto e exclusivo para atendimento a requisições dos titulares e contato com a Autoridade Nacional de Proteção de Dados (ANPD):
* **E-mail do DPO:** privacidade@ofir.com.br
* **Prazo de Atendimento:** Até 15 (quinze) dias úteis, conforme prazos regulamentares da LGPD.
`;
