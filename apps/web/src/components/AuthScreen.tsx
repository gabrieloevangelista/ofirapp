import React, { useState } from 'react';
import { ICONS, useStore, TERMS_OF_USE_TEXT, PRIVACY_POLICY_TEXT } from '@ofirapp/core';
import '../auth-page.css';

interface AuthScreenProps {
  initialView?: 'login' | 'signup' | 'forgot' | 'sent';
  initialRole?: 'owner' | 'supplier';
  onSuccess: (role: 'owner' | 'supplier') => void;
  onBack: () => void;
}

const Svg = ({ k, s = 18, color, sw = 2 }: { k: string; s?: number; color?: string; sw?: number }) => {
  const d = ICONS[k];
  if (!d) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M3 21h18M6 21V10l6-6 6 6v11M9 15l2 2 4-4" />
  </svg>
);

export function AuthScreen({ initialView = 'login', initialRole = 'owner', onSuccess, onBack }: AuthScreenProps) {
  const { signIn, toast, theme, toggleTheme } = useStore();

  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot' | 'sent'>(initialView);
  const [role, setRole] = useState<'owner' | 'supplier'>(initialRole);

  // Estados dos inputs de Login
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginEmail, setLoginEmail] = useState(initialRole === 'supplier' ? 'contato@baseforte.com.br' : 'eduardo@ofir.com.br');
  const [loginPass, setLoginPass] = useState('12345678');

  // Estados dos inputs de Cadastro
  const [signupName, setSignupName] = useState(initialRole === 'supplier' ? 'Base Forte Engenharia' : 'Eduardo Castro');
  const [signupEmail, setSignupEmail] = useState(initialRole === 'supplier' ? 'contato@baseforte.com.br' : 'eduardo@ofir.com.br');
  const [signupPhone, setSignupPhone] = useState('(11) 98765-4321');
  const [signupPass, setSignupPass] = useState('12345678');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupConsent, setSignupConsent] = useState(true);

  // Estados de Esqueci Minha Senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Leitor de Termos / Privacidade
  const [legalModal, setLegalModal] = useState<'termos' | 'privacidade' | null>(null);

  const handleRoleChange = (newRole: 'owner' | 'supplier') => {
    setRole(newRole);
    if (newRole === 'supplier') {
      if (loginEmail === 'eduardo@ofir.com.br') setLoginEmail('contato@baseforte.com.br');
      if (signupEmail === 'eduardo@ofir.com.br') setSignupEmail('contato@baseforte.com.br');
      if (signupName === 'Eduardo Castro') setSignupName('Base Forte Engenharia');
    } else {
      if (loginEmail === 'contato@baseforte.com.br') setLoginEmail('eduardo@ofir.com.br');
      if (signupEmail === 'contato@baseforte.com.br') setSignupEmail('eduardo@ofir.com.br');
      if (signupName === 'Base Forte Engenharia') setSignupName('Eduardo Castro');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'supplier') {
      signIn({ name: 'Base Forte Fundações', email: loginEmail || 'contato@baseforte.com.br', role: 'supplier' });
      toast('Login realizado!', 'Bem-vindo ao Portal de Fornecedores OFIR.');
    } else {
      signIn({ name: 'Eduardo Castro', email: loginEmail || 'eduardo@ofir.com.br', role: 'owner' });
      toast('Login realizado!', 'Bem-vindo de volta à OFIR.');
    }
    onSuccess(role);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      role: role
    });
    toast('Conta criada com sucesso!', `Bem-vindo à OFIR como ${role === 'supplier' ? 'fornecedor parceiro' : 'cliente'}.`);
    onSuccess(role);
  };

  const handleGoogleAuth = () => {
    if (role === 'supplier') {
      signIn({ name: 'Base Forte Fundações', email: 'contato@baseforte.com.br', role: 'supplier' });
      toast('Login realizado com Google!', 'Bem-vindo ao Portal de Fornecedores.');
    } else {
      signIn({ name: 'Eduardo Castro', email: 'eduardo@ofir.com.br', role: 'owner' });
      toast('Login realizado com Google!', 'Bem-vindo à OFIR.');
    }
    onSuccess(role);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setAuthView('sent');
    }, 600);
  };

  return (
    <div className="auth-page">
      {/* Topbar da Tela Dedicada */}
      <header className="auth-page-header">
        <a
          href="#"
          className="brand"
          onClick={e => {
            e.preventDefault();
            onBack();
          }}
          title="Voltar para a página inicial"
        >
          <LogoIcon />
          <span>OFIR</span>
        </a>

        <div className="auth-page-header-actions">
          <button
            type="button"
            className="auth-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            aria-label="Alternar tema"
          >
            <Svg k={theme === 'dark' ? 'sun' : 'moon'} s={18} />
          </button>

          <button
            type="button"
            className="auth-back-btn"
            onClick={onBack}
            title="Voltar para a navegação principal"
          >
            <Svg k="back" s={15} />
            <span>Voltar para o site</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal com Showcase e Card de Autenticação */}
      <main className="auth-page-main">
        {/* Coluna da Esquerda: Confiança e Infraestrutura OFIR */}
        <section className="auth-page-showcase">
          <div className="auth-showcase-badge">
            <Svg k="shield" s={14} color="var(--accent)" />
            <span>Infraestrutura Segura da Construção</span>
          </div>

          <h1 className="auth-showcase-title">
            Construa ou forneça com <span>segurança garantida</span> em cada etapa.
          </h1>

          <p className="auth-showcase-desc">
            A plataforma que conecta donos de obras e fornecedores qualificados. Cotações estruturadas, contratos com validade jurídica e pagamentos protegidos por custódia.
          </p>

          <div className="auth-showcase-pillars">
            <div className="auth-pillar-item">
              <div className="auth-pillar-icon">
                <Svg k="shield" s={20} color="var(--accent)" />
              </div>
              <div className="auth-pillar-info">
                <b>Conta Custódia OFIR</b>
                <p>O valor da contratação fica seguro em conta garantida e só é liberado para o fornecedor após a vistoria e aprovação de cada medição.</p>
              </div>
            </div>

            <div className="auth-pillar-item">
              <div className="auth-pillar-icon">
                <Svg k="check" s={20} color="var(--accent)" />
              </div>
              <div className="auth-pillar-info">
                <b>Rede de Fornecedores Verificados</b>
                <p>Equipes e empresas com CNPJ ativo, certidões negativas, histórico de obras concluídas e capacidade técnica comprovada.</p>
              </div>
            </div>

            <div className="auth-pillar-item">
              <div className="auth-pillar-icon">
                <Svg k="clock" s={20} color="var(--accent)" />
              </div>
              <div className="auth-pillar-info">
                <b>SLA Ágil e Contratos Digitais</b>
                <p>Propostas recebidas em até 72 horas, com cronograma físico-financeiro detalhado e acompanhamento transparente.</p>
              </div>
            </div>
          </div>

          <div className="auth-showcase-proof">
            <div className="auth-proof-stat">
              <b>R$ 180M+</b>
              <span>Em obras sob custódia</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
            <div className="auth-proof-stat">
              <b>388+</b>
              <span>Equipes credenciadas</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
            <div className="auth-proof-stat">
              <b>100%</b>
              <span>Pagamentos auditados</span>
            </div>
          </div>
        </section>

        {/* Coluna da Direita: Card de Autenticação */}
        <section className="auth-page-card">
          {/* Seletor de Modo: Entrar vs Criar conta (quando não em forgot/sent) */}
          {(authView === 'login' || authView === 'signup') && (
            <div className="auth-mode-switch">
              <button
                type="button"
                className={`auth-mode-btn ${authView === 'login' ? 'active' : ''}`}
                onClick={() => setAuthView('login')}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`auth-mode-btn ${authView === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthView('signup')}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* ==================== VISTA 1: LOGIN ==================== */}
          {authView === 'login' && (
            <div>
              <h2 style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Acesse sua conta
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 18px' }}>
                Escolha seu perfil para acessar o ambiente correto.
              </p>

              {/* Seletor de Perfil: Cliente vs Fornecedor (Sem PJ) */}
              <div className="auth-role-select">
                <button
                  type="button"
                  className={`auth-role-card ${role === 'owner' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('owner')}
                >
                  <b>
                    <Svg k="user" s={16} color={role === 'owner' ? 'var(--accent)' : 'var(--text)'} />
                    Sou Cliente
                  </b>
                  <span>Buscar fornecedores e gerenciar obra</span>
                </button>

                <button
                  type="button"
                  className={`auth-role-card ${role === 'supplier' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('supplier')}
                >
                  <b>
                    <Svg k="estrutura" s={16} color={role === 'supplier' ? 'var(--accent)' : 'var(--text)'} />
                    Sou Fornecedor
                  </b>
                  <span>Painel da empresa, cotações e recebíveis</span>
                </button>
              </div>

              {/* Botão Google */}
              <button
                className="social"
                type="button"
                onClick={handleGoogleAuth}
                style={{ width: '100%', marginBottom: 14 }}
              >
                <span className="g">G</span>
                Continuar com Google ({role === 'supplier' ? 'Fornecedor' : 'Cliente'})
              </button>

              <div className="or">ou com e-mail e senha</div>

              {/* Formulário de Login */}
              <form onSubmit={handleLoginSubmit}>
                <div className="inp">
                  <label>E-mail {role === 'supplier' ? 'corporativo' : 'cadastrado'}</label>
                  <input
                    type="email"
                    placeholder="voce@email.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="inp">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ margin: 0 }}>Senha</label>
                    <button
                      type="button"
                      className="link"
                      style={{ fontSize: 12.5 }}
                      onClick={() => setAuthView('forgot')}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="pw">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye"
                      aria-label="Mostrar ou ocultar senha"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                    >
                      <Svg k={showLoginPass ? 'eye' : 'eye'} s={18} />
                    </button>
                  </div>
                </div>

                <button className="btn lg block" type="submit" style={{ marginTop: 18 }}>
                  Entrar como {role === 'supplier' ? 'Fornecedor' : 'Cliente'}
                </button>
              </form>

              <p className="auth-foot" style={{ marginTop: 20, textAlign: 'center' }}>
                Ainda não tem conta?{' '}
                <button type="button" className="link" onClick={() => setAuthView('signup')} style={{ fontWeight: 600 }}>
                  Criar conta
                </button>
              </p>
            </div>
          )}

          {/* ==================== VISTA 2: CADASTRO ==================== */}
          {authView === 'signup' && (
            <div>
              <h2 style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Crie sua conta na OFIR
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 18px' }}>
                Selecione como deseja utilizar a plataforma.
              </p>

              {/* Seletor de Perfil no Cadastro: Cliente vs Fornecedor (Sem PJ) */}
              <div className="auth-role-select">
                <button
                  type="button"
                  className={`auth-role-card ${role === 'owner' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('owner')}
                >
                  <b>
                    <Svg k="user" s={16} color={role === 'owner' ? 'var(--accent)' : 'var(--text)'} />
                    Sou Cliente
                  </b>
                  <span>Vou construir, reformar ou ampliar</span>
                </button>

                <button
                  type="button"
                  className={`auth-role-card ${role === 'supplier' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('supplier')}
                >
                  <b>
                    <Svg k="estrutura" s={16} color={role === 'supplier' ? 'var(--accent)' : 'var(--text)'} />
                    Sou Fornecedor
                  </b>
                  <span>Quero receber pedidos e emitir propostas</span>
                </button>
              </div>

              {/* Formulário de Cadastro */}
              <form onSubmit={handleSignupSubmit}>
                <div className="inp">
                  <label>{role === 'supplier' ? 'Razão Social ou Nome Fantasia' : 'Nome completo'}</label>
                  <input
                    placeholder={role === 'supplier' ? 'Nome da sua empresa' : 'Como devemos te chamar'}
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="inp">
                  <label>{role === 'supplier' ? 'E-mail corporativo' : 'E-mail'}</label>
                  <input
                    type="email"
                    placeholder="voce@email.com"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="inp">
                  <label>WhatsApp de contato</label>
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
                  <label>Crie sua senha</label>
                  <div className="pw">
                    <input
                      type={showSignupPass ? 'text' : 'password'}
                      placeholder="Mínimo de 8 caracteres"
                      value={signupPass}
                      onChange={e => setSignupPass(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye"
                      aria-label="Mostrar ou ocultar senha"
                      onClick={() => setShowSignupPass(!showSignupPass)}
                    >
                      <Svg k={showSignupPass ? 'eye' : 'eye'} s={18} />
                    </button>
                  </div>
                </div>

                {/* Consentimento LGPD */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', margin: '14px 0 16px', lineHeight: 1.45 }}>
                  <input
                    type="checkbox"
                    checked={signupConsent}
                    onChange={e => setSignupConsent(e.target.checked)}
                    style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>
                    Concordo com os{' '}
                    <button type="button" className="link" onClick={() => setLegalModal('termos')}>Termos de Uso</button>
                    {' '}e com a{' '}
                    <button type="button" className="link" onClick={() => setLegalModal('privacidade')}>Política de Privacidade (LGPD)</button>.
                  </span>
                </label>

                <button className="btn lg block" type="submit" disabled={!signupConsent}>
                  Criar conta de {role === 'supplier' ? 'Fornecedor' : 'Cliente'}
                </button>
              </form>

              <p className="auth-foot" style={{ marginTop: 20, textAlign: 'center' }}>
                Já tem conta?{' '}
                <button type="button" className="link" onClick={() => setAuthView('login')} style={{ fontWeight: 600 }}>
                  Entrar
                </button>
              </p>
            </div>
          )}

          {/* ==================== VISTA 3: RECUPERAR SENHA ==================== */}
          {authView === 'forgot' && (
            <div>
              <h2 style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Recuperar senha
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 20px', lineHeight: 1.5 }}>
                Digite seu e-mail cadastrado e enviaremos um link seguro para redefinição imediata.
              </p>

              <form onSubmit={handleForgotSubmit}>
                <div className="inp">
                  <label htmlFor="auth-forgot-email">E-mail cadastrado</label>
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

                <button
                  className="btn lg block"
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  style={{ marginTop: 18 }}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <p className="auth-foot" style={{ marginTop: 20, textAlign: 'center' }}>
                Lembrou da senha?{' '}
                <button type="button" className="link" onClick={() => setAuthView('login')} style={{ fontWeight: 600 }}>
                  Voltar ao login
                </button>
              </p>
            </div>
          )}

          {/* ==================== VISTA 4: E-MAIL ENVIADO ==================== */}
          {authView === 'sent' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(31,122,85,.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ok)', marginBottom: 16 }}>
                <Svg k="check" s={30} sw={2.5} color="var(--ok)" />
              </div>
              <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>E-mail enviado!</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 24px', lineHeight: 1.55 }}>
                Enviamos as instruções com link seguro para <b>{forgotEmail || 'seu e-mail'}</b>. Verifique sua caixa de entrada e spam.
              </p>
              <button
                className="btn lg block"
                type="button"
                onClick={() => setAuthView('login')}
              >
                Voltar para o login
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer Minimalista da Tela */}
      <footer className="auth-page-footer">
        OFIR Soluções Tecnológicas Ltda. · CNPJ 51.890.123/0001-44 · Plataforma segura com custódia em conta escrow regulada
      </footer>

      {/* Modal Leitor dos Termos & Privacidade (Sem perder os campos digitados) */}
      {legalModal && (
        <div className="auth-terms-overlay" onClick={() => setLegalModal(null)}>
          <div className="auth-terms-card" onClick={e => e.stopPropagation()}>
            <div className="auth-terms-head">
              <h3>{legalModal === 'termos' ? 'Termos de Uso da Plataforma OFIR' : 'Política de Privacidade & LGPD'}</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLegalModal(null)}
                aria-label="Fechar termos"
              >
                <Svg k="x" s={18} />
              </button>
            </div>
            <div className="auth-terms-body">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>
                {legalModal === 'termos' ? TERMS_OF_USE_TEXT : PRIVACY_POLICY_TEXT}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
