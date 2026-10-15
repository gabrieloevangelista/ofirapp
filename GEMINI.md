# Regras do Projeto (OFIR / BuyBuild)

1. **Sempre pnpm**: Todos os comandos de gerenciamento de dependências e execução de scripts devem utilizar exclusivamente `pnpm`.
2. **Não fazer build na aplicação**: O build é gerado automaticamente após o commit diretamente no servidor de produção. Nunca execute `pnpm build` ou `vite build` localmente.
3. **Jamais usar emoji**: Proibido estritamente o uso de emojis em qualquer parte da aplicação (código, componentes, botões, títulos, notificações, tooltips ou comentários visíveis). Toda comunicação visual deve ser feita exclusivamente via ícones SVG padronizados do Design System OFIR (`Svg k="..."`).
