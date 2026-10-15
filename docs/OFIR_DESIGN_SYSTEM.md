# OFIR UI Design System & Architecture

Documentação oficial dos padrões de interface, tokens visuais e ergonomia entre as perspectivas do **Cliente (Dono da Obra)** e do **Fornecedor (Parceiro Credenciado)**.

---

## 1. Fundamentos & Filosofia Visual

A OFIR combina a seriedade e segurança da engenharia civil com o acabamento de produtos de tecnologia de ponta (estética *editorial craft* + precisão técnica).

- **Anti-Slop Discipline:** Não usamos dashboards genéricos com cards roxos/gradientes sintéticos de IA, nem layouts frios de painéis administrativos prontos. Toda interface utiliza as proporções, tipografia e componentes físicos do ecossistema OFIR.
- **Materialidade & Profundidade:** Cartões com bordas sutis (`var(--line)`), fundos em tom papel quente/pedra natural (`var(--bg): #f6f5f2`), e mídias visuais enriquecidas por texturas e gradientes analógicos (`.media.m1` a `.m9`).

---

## 2. Tipografia

| Função | Família | Peso / Rastreamento | Exemplo de Aplicação |
| :--- | :--- | :--- | :--- |
| **Títulos Editoriais & H2** | `Source Serif 4`, serif | `400 / 500 / 600`, entrelinha elegante | Títulos de seções, painéis (`.panel h2`), propostas |
| **Métricas & Números** | `Archivo`, sans-serif | `900`, `font-stretch: 80-85%`, tabular | Valores em R$, KPIs, cronômetro de 72h, etapas (`.n`) |
| **Interface, Botões & Labels** | `Inter`, sans-serif | `500 / 600 / 700` | Textos de botões, inputs, chips, mensagens do chat |
| **Eyebrows (Super-títulos)** | `Inter`, sans-serif | `600`, `text-transform: uppercase`, `letter-spacing: .08em` | `.eyebrow` acima de títulos de seção |

---

## 3. Paleta de Cores e Diferenciação de Papel (Roles)

Ambas as perspectivas compartilham 100% da geometria, grid e micro-interações, diferenciando-se pela cor de acento primária (`--accent`):

### A. Perspectiva do Cliente (Dono da Obra)
- **Tom Primário:** Verde Floresta da Construção Sustentável
  - Light: `--accent: #174a40` / `--accent-2: #0f3a32`
  - Dark: `--accent: #267b6b` / `--accent-2: #195c50`
- **Significado:** Natureza, sustentabilidade, construção consciente, segurança patrimonial.

### B. Perspectiva do Fornecedor (Parceiro B2B)
- **Tom Primário:** Azul Safira / Cobalto Industrial Corporativo
  - Light: `--accent: #1e3a8a` / `--accent-2: #172554`
  - Dark: `--accent: #3b82f6` / `--accent-2: #1d4ed8`
- **Significado:** Confiança comercial, contratos corporativos, faturamento e custódia segura.

### Variáveis Globais Compartilhadas
```css
:root {
  --bg: #f6f5f2;
  --surface: #ffffff;
  --surface-2: #f1f0ec;
  --surface-3: #e9e7e2;
  --line: rgba(20, 20, 18, 0.08);
  --line-2: rgba(20, 20, 18, 0.14);
  --text: #16171a;
  --text-2: #45474d;
  --muted: #7a7c82;
  --ok: #1f7a55;
  --r: 10px;
  --g: 16px;
}

html.dark {
  --bg: #0f1113;
  --surface: #181b1f;
  --surface-2: #202428;
  --surface-3: #2a3036;
  --line: rgba(255, 255, 255, 0.08);
  --line-2: rgba(255, 255, 255, 0.14);
  --text: #f2f4f6;
  --text-2: #b8bcc2;
  --muted: #868b92;
  --ok: #2cb07b;
}
```

---

## 4. Componentes Canônicos da OFIR

### 1. Barra de Navegação (`.nav`)
- Logo com marca nominal e ícone de estrutura geométrica.
- Abas horizontais com scroll suave (`.tabs a`), com pílula indicadora no item ativo (`.active`).
- Chip de localização/endereço com chevron (`.addr-chip`).
- Botão de alternância de visão com pílula de papel (*Cliente* vs *Fornecedor*).

### 2. O Card de Proposta Comercial (`.prop`)
Estrutura central do sistema de contratação e custódia (escrow):
```html
<div class="prop">
  <div class="prop-head">
    <span class="eyebrow">Solicitação de pagamento</span>
    <span class="pill ok">Contrato fechado</span>
  </div>
  <h4>Fundação em radier</h4>
  <p class="pm">420 m² · 26 dias · materiais inclusos</p>
  <div class="rows">
    <div><span>Etapa 1 · Escavação</span><b>R$ 58.200</b></div>
    <div><span>Etapa 2 · Concretagem</span><b>R$ 96.800</b></div>
    <div class="tot"><span>Total</span><b>R$ 155.000</b></div>
  </div>
  <div class="escrow">
    <b>R$ 155.000 protegido.</b> A etapa 1 é liberada ao fornecedor quando você confirmar que foi concluída.
  </div>
  <div class="prop-acts">
    <button class="ghost">Negociar</button>
    <button class="btn">Aceitar e pagar</button>
  </div>
</div>
```

### 3. Painel de Destaque & Métricas (`.feature-row`, `.panel`, `.cards`)
- Grid assimétrico (1fr / 2fr).
- `.panel` à esquerda com resumo editorial e progresso em barras (`.progress .bar`).
- `.cards` com três cartões de alta densidade informativa (`.card`), ícone com fundo suave (`.ico.acc`), títulos limpos e setas deslizantes (`.arrow`).

### 4. Bate-papo & Negociação (`.chat`, `.msg`, `.composer`)
- Mensagens do cliente (`.msg.me` no cliente / `.msg.them` no fornecedor) e do parceiro.
- Propostas embutidas inline dentro da linha do tempo.
- Barra de composição com botão circular de anexo (`.attach-btn`) e envio direto.
- SLA de 72 horas em banner com barra de progresso regressiva (`.quote-clock-banner`).
