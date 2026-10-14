import React, { useState, useRef, useEffect, useId } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  hint?: string;
  allowCustomInput?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  variant?: 'default' | 'filter' | 'hero' | 'sim';
  searchable?: boolean;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  loading = false,
  error,
  hint,
  allowCustomInput = false,
  required = false,
  className = '',
  variant = 'default',
  searchable,
  ariaLabel,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determina se deve exibir o campo de busca (padrão true se mais de 6 opções ou se permite custom input)
  const isSearchable = searchable !== undefined ? searchable : (options.length >= 7 || allowCustomInput);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHighlightIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Foco e inicialização ao abrir
  useEffect(() => {
    if (isOpen) {
      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
      // Inicializa índice de destaque no item atualmente selecionado
      const currentIndex = options.findIndex(o => o.value.toLowerCase() === value.toLowerCase());
      setHighlightIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setSearch('');
      setHighlightIndex(-1);
    }
  }, [isOpen, isSearchable, options, value]);

  const selectedOption = options.find(o => o.value.toLowerCase() === value.toLowerCase());
  const displayLabel = selectedOption ? selectedOption.label : value;

  // Filtra opções pela busca
  const cleanSearch = search.trim().toLowerCase();
  const filteredOptions = options.filter(opt => {
    if (!cleanSearch) return true;
    return (
      opt.label.toLowerCase().includes(cleanSearch) ||
      opt.value.toLowerCase().includes(cleanSearch) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(cleanSearch))
    );
  });

  const hasExactMatch = options.some(
    o => o.value.toLowerCase() === cleanSearch || o.label.toLowerCase() === cleanSearch
  );

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearch('');
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
        onChange(filteredOptions[highlightIndex].value);
        setIsOpen(false);
        setSearch('');
        triggerRef.current?.focus();
      } else if (allowCustomInput && search.trim() && !hasExactMatch) {
        onChange(search.trim());
        setIsOpen(false);
        setSearch('');
        triggerRef.current?.focus();
      }
    }
  };

  const isFormInp = variant === 'default' || variant === 'sim';

  return (
    <div
      ref={containerRef}
      className={`${isFormInp ? 'inp' : ''} custom-select-container variant-${variant} ${isOpen ? 'is-open' : ''} ${error ? 'bad' : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label htmlFor={selectId}>
          {label}
          {required && <span className="req-star" style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
        </label>
      )}

      <div className="custom-select-trigger-wrap">
        <button
          ref={triggerRef}
          type="button"
          id={selectId}
          className={`custom-select-trigger ${!value ? 'is-empty' : ''} ${disabled ? 'is-disabled' : ''}`}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || label || placeholder}
        >
          <span className="custom-select-value">
            {displayLabel ? (
              <span className="val-text">
                {displayLabel}
                {selectedOption?.sublabel && variant !== 'filter' && variant !== 'hero' && (
                  <small className="val-sub"> · {selectedOption.sublabel}</small>
                )}
              </span>
            ) : (
              <span className="placeholder-text">{placeholder}</span>
            )}
          </span>

          <span className="custom-select-icons">
            {loading ? (
              <span className="select-spinner" title="Carregando..." />
            ) : (
              <svg
                className={`select-arrow ${isOpen ? 'open' : ''}`}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </span>
        </button>

        {/* Dropdown com opções */}
        {isOpen && (
          <div className="custom-select-dropdown" role="listbox">
            {isSearchable && (
              <div className="custom-select-search-bar" onClick={e => e.stopPropagation()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 11a7 7 0 1 0 14 0 7 7 0 0 0-14 0M20 20l-3.5-3.5" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="custom-select-search-input"
                />
                {search && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => {
                      setSearch('');
                      searchInputRef.current?.focus();
                    }}
                    title="Limpar busca"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div ref={listRef} className="custom-select-options-list">
              {/* Opção para digitar customizada se não houver match exato */}
              {allowCustomInput && search.trim() && !hasExactMatch && (
                <div
                  className="custom-select-option custom-add-option"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onChange(search.trim());
                    setIsOpen(false);
                    setSearch('');
                    triggerRef.current?.focus();
                  }}
                >
                  <div className="opt-content">
                    <span className="opt-title">Usar &quot;{search.trim()}&quot;</span>
                    <small className="opt-sub">Adicionar valor manualmente</small>
                  </div>
                  <span className="opt-badge">+</span>
                </div>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value.toLowerCase() === value.toLowerCase();
                  const isHighlighted = idx === highlightIndex;
                  return (
                    <div
                      key={opt.value}
                      className={`custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                        triggerRef.current?.focus();
                      }}
                      onMouseEnter={() => setHighlightIndex(idx)}
                    >
                      <div className="opt-content">
                        <span className="opt-title">{opt.label}</span>
                        {opt.sublabel && <small className="opt-sub">{opt.sublabel}</small>}
                      </div>
                      {isSelected && (
                        <svg className="opt-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      )}
                    </div>
                  );
                })
              ) : (
                !allowCustomInput || !search.trim() ? (
                  <div className="custom-select-empty">
                    <p>Nenhuma opção encontrada</p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {error && <small className="err" style={{ display: 'block', marginTop: 4 }}>{error}</small>}
      {hint && !error && <small className="hint">{hint}</small>}
    </div>
  );
};
