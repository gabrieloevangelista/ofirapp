import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ICONS, SUPPLIERS, MAX_PDF_BYTES, GPT_DEFAULT_MODEL, ProjectAIError,
  analyzeProject, catLabel, fmtBytes, rate, serves, useStore,
  type ChecklistItem
} from '@ofirapp/core';
import '../project-ai.css';

const OPENAI_KEY: string | undefined =
  (import.meta as any).env?.VITE_OPENAI_API_KEY ||
  (import.meta as any).env?.VITE_GPT_API_KEY ||
  (import.meta as any).env?.VITE_GEMINI_API_KEY;
const OPENAI_MODEL: string =
  (import.meta as any).env?.VITE_OPENAI_MODEL ||
  (import.meta as any).env?.VITE_GPT_MODEL ||
  GPT_DEFAULT_MODEL;

const Ico = ({ k, s = 16, sw = 2 }: { k: string; s?: number; sw?: number }) => {
  const d = ICONS[k];
  if (!d) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
};

const Sparkle = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c.4 3.9 2.1 6.6 6.9 7.6.5.1.5.8 0 .9C14.1 11.4 12.4 14.1 12 18c-.4-3.9-2.1-6.6-6.9-7.5-.5-.1-.5-.8 0-.9C9.9 8.6 11.6 5.9 12 2Z" />
    <path d="M19 15c.2 1.6.9 2.6 2.7 3 .2 0 .2.3 0 .4-1.8.4-2.5 1.4-2.7 3-.2-1.6-.9-2.6-2.7-3-.2-.1-.2-.4 0-.4 1.8-.4 2.5-1.4 2.7-3Z" opacity=".7" />
  </svg>
);

const STEPS = [
  'Lendo pranchas e arquivos do projeto',
  'Identificando ambientes e áreas',
  'Calculando quantitativos com GPT-4o',
  'Montando o checklist por etapa',
  'Selecionando fornecedores da região'
];

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    r.readAsDataURL(file);
  });

type Phase = 'upload' | 'analyzing' | 'result';

export function ProjectAnalyzer({
  onOpenQuote,
  onOpenSupplier
}: {
  onOpenQuote: (qid: string) => void;
  onOpenSupplier: (name: string) => void;
}) {
  const {
    obra, addresses, addrSel, projectAnalyses, saveAnalysis, removeAnalysis,
    toggleChecklistItem, toggleChecklistSupplier, setAllChecklist, sendChecklistQuotes,
    requireAuth, toast
  } = useStore();

  const curA = addresses.find(a => a.id === addrSel);
  const city = curA?.city || obra.city;
  const uf = curA?.uf || obra.uf;

  const [phase, setPhase] = useState<Phase>(projectAnalyses.length ? 'result' : 'upload');
  const [activeId, setActiveId] = useState<string | null>(projectAnalyses[0]?.id || null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<'svc' | 'mat'>('svc');
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analysis = projectAnalyses.find(a => a.id === activeId) || null;

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    setStep(0);
    const t = setInterval(() => setStep(s => Math.min(STEPS.length - 1, s + 1)), 1100);
    return () => clearInterval(t);
  }, [phase]);

  const pickFile = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    const isAllowed = /\.(pdf|png|jpe?g|webp)$/i.test(f.name) ||
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type);
    if (!isAllowed) { setError('Envie o projeto em formato PDF ou imagem (PNG, JPG, WEBP).'); return; }
    if (f.size > MAX_PDF_BYTES) { setError(`O arquivo tem ${fmtBytes(f.size)}. O limite é ${fmtBytes(MAX_PDF_BYTES)} — envie um arquivo menor.`); return; }
    setFile(f);
  };

  const run = async (withFile: boolean) => {
    setError(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase('analyzing');
    try {
      const base64 = withFile && file ? await readAsBase64(file) : undefined;
      const result = await analyzeProject({
        base64,
        fileName: withFile && file ? file.name : undefined,
        fileSize: withFile && file ? fmtBytes(file.size) : undefined,
        apiKey: OPENAI_KEY,
        model: OPENAI_MODEL,
        signal: ctrl.signal,
        ctx: { obraName: obra.name, area: obra.area, systemKey: obra.systemKey, systemName: obra.system, city, uf }
      });
      saveAnalysis(result);
      setActiveId(result.id);
      setTab('svc');
      setPhase('result');
      setFile(null);
      toast('Checklist pronto', `${result.items.length} itens identificados${result.source === 'gpt' ? ' pelo GPT' : result.source === 'gemini' ? ' pelo Gemini' : ''}.`);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e instanceof ProjectAIError ? e.message : 'Não foi possível analisar o projeto. Tente novamente.');
      setPhase('upload');
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setPhase('upload');
  };

  /* ---------- dados derivados do checklist ---------- */
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

  const send = () => {
    if (!analysis) return;
    requireAuth(() => {
      const qid = sendChecklistQuotes(analysis.id);
      if (!qid) {
        toast('Selecione ao menos um fornecedor', 'Marque os itens e os fornecedores que devem receber a solicitação.');
      } else {
        toast('Cotação enviada com sucesso!', `${stats.sups} fornecedores notificados.`);
        onOpenQuote(qid);
      }
    });
  };

  /* ---------- UPLOAD ---------- */
  if (phase === 'upload') {
    return (
      <div className="pa">
        <div className="pa-hero">
          <span className="pa-hero-badge"><Sparkle s={13} /> IA OFIR</span>
          <h2 className="display">Envie o projeto e receba o checklist da obra</h2>
          <p>A IA lê as plantas, identifica ambientes e áreas, estima quantidades e sugere os fornecedores da sua região para cada item. Depois é só enviar as solicitações de orçamento de uma vez.</p>
        </div>

        <div
          className={`pa-drop ${drag ? 'drag' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
          onClick={() => !file && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          id="pa-dropzone"
          onKeyDown={e => { if (e.key === 'Enter' && !file) inputRef.current?.click(); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            hidden
            id="pa-file-input"
            onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
          />
          {file ? (
            <div className="pa-file">
              <span className="pa-file-ico"><Ico k="doc" s={22} /></span>
              <span className="pa-file-txt"><b>{file.name}</b><small>{fmtBytes(file.size)} · Arquivo pronto para análise com GPT</small></span>
              <button className="icon-btn" type="button" aria-label="Remover arquivo" onClick={e => { e.stopPropagation(); setFile(null); }}>
                <Ico k="x" s={15} />
              </button>
            </div>
          ) : (
            <>
              <span className="pa-drop-ico"><Ico k="projeto" s={26} sw={1.6} /></span>
              <b>Arraste a planta ou PDF do projeto arquitetônico</b>
              <span>ou <u>clique para escolher</u> · PDF ou imagem até {fmtBytes(MAX_PDF_BYTES)}</span>
            </>
          )}
        </div>

        {error && <div className="pa-error" role="alert"><Ico k="x" s={14} /> {error}</div>}

        <div className="pa-ctx">
          <span><Ico k="home" s={14} /> {obra.name} · {obra.area} m²</span>
          <span><Ico k="estrutura" s={14} /> {obra.system}</span>
          <span><Ico k="pin" s={14} /> {city}/{uf}</span>
        </div>

        <button className="btn lg block" id="pa-analyze-btn" type="button" disabled={!file} onClick={() => run(true)}>
          <Sparkle s={16} /> Analisar projeto com GPT
        </button>
        <button className="pa-skip" id="pa-skip-btn" type="button" onClick={() => run(false)}>
          Ainda não tenho o projeto · gerar checklist pelos dados da obra
        </button>

        {!OPENAI_KEY && (
          <p className="pa-note">
            Modo demonstração: defina <code>VITE_OPENAI_API_KEY</code> em <code>apps/web/.env.local</code> para o GPT analisar o projeto de verdade. Sem a chave, o checklist é estimado pelos dados da obra.
          </p>
        )}

        {projectAnalyses.length > 0 && (
          <>
            <p className="sec-label">Análises anteriores</p>
            {projectAnalyses.map(a => (
              <button key={a.id} className="cot-row" onClick={() => { setActiveId(a.id); setPhase('result'); }}>
                <span className="txt">
                  <b>{a.fileName || 'Checklist pelos dados da obra'}</b>
                  <small>{new Date(a.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {a.items.length} itens{a.quoteId ? ` · ${a.quoteId}` : ''}</small>
                </span>
                {a.quoteId ? <span className="cot-pill recv">Enviado</span> : <span className="cot-pill wait">Rascunho</span>}
                <Ico k="next" s={16} />
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  /* ---------- ANALISANDO ---------- */
  if (phase === 'analyzing') {
    return (
      <div className="pa pa-loading" aria-live="polite">
        <div className="pa-scan">
          <div className="pa-sheet">
            <i /><i /><i /><i /><i /><i />
            <span className="pa-beam" />
          </div>
          <span className="pa-scan-badge"><Sparkle s={14} /></span>
        </div>
        <h3 className="display">Analisando {file ? 'o projeto' : 'os dados da obra'}…</h3>
        <p className="pa-loading-sub">{file ? file.name : `${obra.name} · ${obra.area} m²`}</p>
        <ol className="pa-steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'on' : ''}>
              <span className="dot">{i < step ? <Ico k="check" s={11} sw={3} /> : null}</span>
              {s}
            </li>
          ))}
        </ol>
        <button className="ghost sm" type="button" onClick={cancel}>Cancelar</button>
      </div>
    );
  }

  /* ---------- RESULTADO ---------- */
  if (!analysis) {
    return (
      <div className="pa">
        <button className="btn" onClick={() => setPhase('upload')}>Enviar projeto</button>
      </div>
    );
  }

  const sm = analysis.summary;
  const sent = !!analysis.quoteId;

  return (
    <div className="pa pa-result">
      <div className="pa-sum">
        <div className="pa-sum-top">
          <div>
            <span className="eyebrow">Checklist da obra</span>
            <h2 className="display">{sm.tipo}</h2>
            <p className="meta">{analysis.fileName ? <><Ico k="doc" s={13} /> {analysis.fileName}{analysis.fileSize ? ` · ${analysis.fileSize}` : ''}</> : 'Estimado pelos dados da obra'}</p>
          </div>
          <span className={`pa-src ${analysis.source}`}>
            <Sparkle s={12} /> {analysis.source === 'gpt' ? `GPT · ${analysis.model?.replace('gpt-', '') || '4o'}` : analysis.source === 'gemini' ? `Gemini · ${analysis.model?.replace('gemini-', '')}` : 'Análise simulada'}
          </span>
        </div>
        <div className="pa-kpis">
          <div><small>Área</small><b>{sm.area} m²</b></div>
          <div><small>Pavimentos</small><b>{sm.pavimentos}</b></div>
          <div><small>Quartos</small><b>{sm.quartos}</b></div>
          <div><small>Banheiros</small><b>{sm.banheiros}</b></div>
          <div className="wide"><small>Sistema</small><b>{sm.sistema || '—'}</b></div>
          <div><small>Padrão</small><b>{sm.padrao}</b></div>
        </div>
        {sm.ambientes.length > 0 && (
          <div className="pa-amb">
            {sm.ambientes.map(a => <span key={a}>{a}</span>)}
          </div>
        )}
        {sm.observacoes.length > 0 && (
          <ul className="pa-obs">
            {sm.observacoes.map(o => <li key={o}>{o}</li>)}
          </ul>
        )}
      </div>

      {sent && (
        <div className="pa-sent">
          <span className="pa-sent-ico"><Ico k="check" s={18} sw={2.6} /></span>
          <div>
            <b>Solicitações enviadas · {analysis.quoteId}</b>
            <span>Os fornecedores têm até 72h para responder. Desistência ou cancelamento permitidos em até 24h.</span>
          </div>
          <button className="btn sm" onClick={() => onOpenQuote(analysis.quoteId!)}>Ver cotação</button>
        </div>
      )}

      {/* BANNER DE CONSULTORIA INTELIGENTE COM LIBERDADE DE ESCOLHA */}
      <div className="pa-consultancy-banner">
        <div className="pa-consultancy-head">
          <span className="pa-consultancy-badge">
            <Sparkle s={13} /> Consultoria IA OFIR · Pilares da Recomendação
          </span>
          <span className="pa-freedom-pill">Liberdade total de escolha</span>
        </div>
        <p>
          Avaliamos fornecedores cruzando <strong>logística (distância até a obra)</strong>, <strong>reputação de avaliações</strong> e <strong>custo-benefício</strong>. As sugestões são apenas um guia consultivo — você é livre para selecionar ou trocar qualquer empresa antes de enviar.
        </p>
        <div className="pa-consultancy-tags">
          <span><Ico k="pin" s={12} /> <b>Logística:</b> Menor frete e visita ágil</span>
          <span><Ico k="shield" s={12} /> <b>Custo-benefício:</b> Eficiência de preço</span>
          <span><Ico k="trophy" s={12} /> <b>Reputação:</b> Histórico verificado</span>
          <span><Ico k="sparkles" s={12} /> <b>Qualidade:</b> Especialidade técnica</span>
        </div>
      </div>

      <div className="pa-toolbar">
        <div className="pa-seg" role="tablist">
          <button role="tab" aria-selected={tab === 'svc'} className={tab === 'svc' ? 'on' : ''} onClick={() => setTab('svc')}>
            Serviços por etapa <span>{stats.svc}</span>
          </button>
          <button role="tab" aria-selected={tab === 'mat'} className={tab === 'mat' ? 'on' : ''} onClick={() => setTab('mat')}>
            Materiais <span>{stats.mat}</span>
          </button>
        </div>
        <div className="pa-bulk">
          <button className="link" onClick={() => setAllChecklist(analysis.id, true, tab)}>Marcar todos</button>
          <button className="link" onClick={() => setAllChecklist(analysis.id, false, tab)}>Desmarcar</button>
        </div>
      </div>

      {groups.length === 0 && <p className="pa-note">Nenhum item nesta categoria.</p>}

      {groups.map(([cat, list]) => (
        <section key={cat} className="pa-group">
          <header>
            <span className="ico"><Ico k={cat} s={15} /></span>
            <b>{catLabel(cat)}</b>
            <small>{list.length} {list.length > 1 ? 'itens' : 'item'}</small>
          </header>
          {list.map(it => (
            <article key={it.id} className={`pa-item ${it.checked ? 'on' : ''} ${!it.suppliers.length ? 'nosup' : ''}`}>
              <label className="pa-check">
                <input
                  type="checkbox"
                  checked={it.checked}
                  disabled={!it.suppliers.length}
                  onChange={() => toggleChecklistItem(analysis.id, it.id)}
                  aria-label={`Incluir ${it.title}`}
                />
                <span className="box"><Ico k="check" s={12} sw={3} /></span>
              </label>
              <div className="pa-item-body">
                <div className="pa-item-head">
                  <b>{it.title}</b>
                  {it.qty ? <span className="pa-qty">{it.qty.toLocaleString('pt-BR')} {it.un}</span> : null}
                  <span className={`pa-pri ${it.priority}`}>{it.priority === 'alta' ? 'Prioridade alta' : it.priority === 'media' ? 'Média' : 'Baixa'}</span>
                </div>
                {it.detail && <p>{it.detail}</p>}
                <div className="pa-conf" title={`Confiança da IA: ${Math.round(it.confidence * 100)}%`}>
                  <i style={{ width: `${Math.round(it.confidence * 100)}%` }} />
                  <small>{Math.round(it.confidence * 100)}% de confiança</small>
                </div>
                {it.suppliers.length ? (
                  <div className="pa-sups">
                    {it.suppliers.map(n => {
                      const x = SUPPLIERS.find(s => s.n === n);
                      const on = it.selected.includes(n);
                      const ok = x ? serves(x, city) : false;
                      const cItem = it.consultancy?.find(c => c.name === n);
                      return (
                        <div key={n} className={`pa-sup-card ${on ? 'on' : ''}`}>
                          <div className="pa-sup-main">
                            <button type="button" className="pa-sup-tog" aria-pressed={on} onClick={() => toggleChecklistSupplier(analysis.id, it.id, n)} disabled={sent}>
                              <span className={`av media ${x?.m || 'm1'}`} />
                              <span className="pa-sup-txt">
                                <span className="pa-sup-title-row">
                                  <b>{n}</b>
                                  {cItem && (
                                    <span className={`pa-pillar-tag ${cItem.pillar}`}>
                                      {cItem.tag}
                                    </span>
                                  )}
                                </span>
                                <small style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ico k="star" s={11} /> {x ? rate(x.r) : '—'} ({x?.a || 0} avaliações) · {x?.c || ''} {cItem ? `· ~${cItem.distanceKm} km da obra` : ''}</small>
                              </span>
                              <span className="pa-sup-chk">{on ? <Ico k="check" s={11} sw={3} /> : null}</span>
                            </button>
                            <button type="button" className="pa-sup-eye" aria-label={`Ver perfil de ${n}`} title="Ver perfil do fornecedor" onClick={() => onOpenSupplier(n)}>
                              <Ico k="eye" s={14} />
                            </button>
                          </div>
                          {cItem?.reason && (
                            <div className="pa-consultancy-reason">
                              <span className="pa-bulb-ico"><Ico k="bulb" s={14} /></span>
                              <span>{cItem.reason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <small className="pa-nosup">Ainda não há fornecedores desta categoria na plataforma.</small>
                )}
              </div>
            </article>
          ))}
        </section>
      ))}

      <div className="pa-policy-24h">
        <Ico k="shield" s={16} />
        <span><b>Garantia de Desistência em 24h:</b> Você pode cancelar pedidos ou excluir cotações em até 24 horas sem custos ou taxas.</span>
      </div>

      <div className="pa-foot">
        <div className="pa-foot-txt">
          <b>{stats.checked} {stats.checked === 1 ? 'item' : 'itens'} · {stats.sups} {stats.sups === 1 ? 'fornecedor' : 'fornecedores'}</b>
          <small>{analysis.fileName ? 'O PDF do projeto vai anexado em cada solicitação' : 'O checklist vai junto em cada solicitação'}</small>
        </div>
        <button className="ghost sm" type="button" onClick={() => { setPhase('upload'); }}>Novo projeto</button>
        {sent ? (
          <button className="btn" type="button" onClick={() => onOpenQuote(analysis.quoteId!)}>Ver cotação</button>
        ) : (
          <button className="btn" id="pa-send-btn" type="button" disabled={!stats.sups} onClick={send}>
            <Ico k="msg" s={15} /> Enviar {stats.sups} {stats.sups === 1 ? 'solicitação' : 'solicitações'}
          </button>
        )}
      </div>
      {!sent && (
        <button className="pa-skip danger" type="button" onClick={() => { removeAnalysis(analysis.id); setActiveId(null); setPhase('upload'); }}>
          Descartar este checklist
        </button>
      )}
    </div>
  );
}
