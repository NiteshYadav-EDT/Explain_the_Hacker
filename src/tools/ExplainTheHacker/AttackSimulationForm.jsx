import { useState, useRef, useCallback } from 'react';
import { PORT_PRESETS, MISCONFIGURATION_SUGGESTIONS } from './validationSchema';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconX({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function IconAlertCircle() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
function IconPlus({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
function IconSearch() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}
function IconRefresh() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
        </svg>
    );
}
function IconChevronDown() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

// ─── Field Error ──────────────────────────────────────────────────────────────
function FieldError({ message }) {
    if (!message) return null;
    return (
        <p className="field-error mt-1.5">
            <IconAlertCircle />
            {message}
        </p>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ number, title, subtitle, count, max }) {
    return (
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
                <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                    {number}
                </span>
                <div>
                    <p className="field-label mb-0">{title}</p>
                    {subtitle && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
                    )}
                </div>
            </div>
            {max !== undefined && (
                <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                        background: count >= max ? '#fef2f2' : 'var(--color-surface-2)',
                        color: count >= max ? 'var(--color-danger)' : 'var(--color-text-muted)',
                        border: `1px solid ${count >= max ? '#fecaca' : 'var(--color-border)'}`,
                    }}
                >
                    {count}/{max}
                </span>
            )}
        </div>
    );
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
function Tag({ label, onRemove, color = 'blue', id }) {
    const styles = {
        blue: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
        green: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
        red: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
        purple: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
        gray: { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
    };
    const s = styles[color] || styles.blue;
    return (
        <span
            id={id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
            {label}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${label}`}
                    className="flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
                    style={{ color: s.color, lineHeight: 1 }}
                >
                    <IconX size={10} />
                </button>
            )}
        </span>
    );
}

// ─── Open Ports Input ─────────────────────────────────────────────────────────
function OpenPortsInput({ ports, onAddPort, onAddPorts, onRemovePort, error }) {
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');
    const [presetsOpen, setPresetsOpen] = useState(false);
    const inputRef = useRef(null);

    const tryAdd = useCallback(() => {
        if (!inputValue.trim()) return;
        // Handle comma/space-separated batch entry
        const parts = inputValue.split(/[\s,]+/).filter(Boolean);
        let lastErr = '';
        parts.forEach((part) => {
            const err = onAddPort(part);
            if (err) lastErr = err;
        });
        setInputError(lastErr);
        setInputValue('');
    }, [inputValue, onAddPort]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            tryAdd();
        }
        if (e.key === 'Backspace' && !inputValue && ports.length > 0) {
            onRemovePort(ports[ports.length - 1]);
        }
    };

    const handleInputChange = (e) => {
        // Allow only digits, commas, spaces
        const val = e.target.value.replace(/[^0-9,\s]/g, '');
        setInputValue(val);
        if (inputError) setInputError('');
    };

    return (
        <div>
            {/* Port Tag Cloud + Input */}
            <div
                className="input-field flex flex-wrap gap-1.5 items-center cursor-text min-h-[48px]"
                style={{ padding: '8px 12px', height: 'auto' }}
                onClick={() => inputRef.current?.focus()}
            >
                {ports.map((port) => (
                    <Tag
                        key={port}
                        id={`port-tag-${port}`}
                        label={port}
                        color="blue"
                        onRemove={() => onRemovePort(port)}
                    />
                ))}
                {ports.length < 50 && (
                    <input
                        ref={inputRef}
                        id="port-input"
                        type="text"
                        inputMode="numeric"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={tryAdd}
                        placeholder={ports.length === 0 ? 'e.g. 22, 80, 443…' : ''}
                        className="border-none outline-none bg-transparent text-sm flex-1 min-w-[120px]"
                        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
                        aria-label="Add port number"
                    />
                )}
            </div>

            {/* Inline input error */}
            {inputError && (
                <p className="field-error mt-1">
                    <IconAlertCircle /> {inputError}
                </p>
            )}

            {/* Port quick-add button */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Quick add:</span>
                <div className="relative">
                    <button
                        type="button"
                        id="port-presets-btn"
                        className="btn-secondary text-xs flex items-center gap-1.5"
                        style={{ padding: '5px 10px' }}
                        onClick={() => setPresetsOpen((p) => !p)}
                    >
                        Presets <IconChevronDown />
                    </button>
                    {presetsOpen && (
                        <div
                            className="absolute left-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[260px] animate-fade-in"
                        >
                            {PORT_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset.label}
                                    id={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="font-semibold text-gray-900">{preset.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {preset.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {ports.length > 0 && (
                    <button
                        type="button"
                        id="clear-ports-btn"
                        className="text-xs transition-opacity hover:opacity-70"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => ports.forEach(onRemovePort)}
                    >
                        Clear all
                    </button>
                )}
            </div>

            <FieldError message={error} />
        </div>
    );
}

// ─── Misconfigurations Input ──────────────────────────────────────────────────
function MisconfigurationsInput({ misconfigs, onAdd, onRemove, error }) {
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const inputRef = useRef(null);

    const tryAdd = useCallback((val = inputValue) => {
        const trimmed = val.trim();
        if (!trimmed) return;
        const err = onAdd(trimmed);
        if (err) {
            setInputError(err);
        } else {
            setInputValue('');
            setInputError('');
        }
    }, [inputValue, onAdd]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            tryAdd();
        }
        if (e.key === 'Backspace' && !inputValue && misconfigs.length > 0) {
            onRemove(misconfigs[misconfigs.length - 1]);
        }
    };

    const filteredSuggestions = MISCONFIGURATION_SUGGESTIONS.filter(
        (s) => !misconfigs.includes(s) &&
            (!inputValue.trim() || s.toLowerCase().includes(inputValue.toLowerCase()))
    );

    return (
        <div>
            {/* Tags + relative wrapper for suggestions */}
            <div className="relative">
                {/* Tag Cloud */}
                {misconfigs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {misconfigs.map((m) => (
                            <Tag
                                key={m}
                                id={`misc-tag-${m.replace(/\s+/g, '-').toLowerCase()}`}
                                label={m}
                                color="purple"
                                onRemove={() => onRemove(m)}
                            />
                        ))}
                    </div>
                )}

                {/* Input row */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            id="misconfiguration-input"
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                if (inputError) setInputError('');
                                setSuggestionsOpen(true);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setSuggestionsOpen(true)}
                            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                            placeholder="e.g. Default credentials not changed"
                            className="input-field pr-8"
                            style={{ fontFamily: 'var(--font-sans)' }}
                            disabled={misconfigs.length >= 20}
                            aria-label="Add misconfiguration"
                            maxLength={200}
                        />
                        {/* Suggestions dropdown */}
                        {suggestionsOpen && filteredSuggestions.length > 0 && misconfigs.length < 20 && (
                            <div
                                className="absolute left-0 top-full mt-1 z-50 card py-1 w-full max-h-48 overflow-y-auto animate-fade-in"
                                style={{ border: '1px solid var(--color-border)' }}
                            >
                                {filteredSuggestions.map((s) => (
                                    <button
                                        type="button"
                                        key={s}
                                        className="w-full text-left px-3 py-2 text-sm transition-colors"
                                        style={{ color: 'var(--color-text-primary)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onAdd(s);
                                            setInputValue('');
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        id="add-misconfiguration-btn"
                        className="btn-secondary flex items-center gap-1.5 flex-shrink-0"
                        style={{ padding: '10px 14px' }}
                        onClick={() => tryAdd()}
                        disabled={misconfigs.length >= 20}
                    >
                        <IconPlus /> Add
                    </button>
                </div>
            </div>

            {inputError && <p className="field-error mt-1"><IconAlertCircle /> {inputError}</p>}
            <FieldError message={error} />
        </div>
    );
}

// ─── Log Snippet Textarea ─────────────────────────────────────────────────────
function LogSnippetTextarea({ value, onChange, error }) {
    const MAX = 5000;
    const remaining = MAX - value.length;
    const isNearLimit = remaining < 500;

    return (
        <div>
            <textarea
                id="log-snippet-input"
                rows={7}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste raw log output here (auth logs, syslog, IDS alerts, firewall drops…)"
                maxLength={MAX}
                className="input-field resize-y"
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    minHeight: 120,
                }}
                aria-label="Log snippet"
                spellCheck={false}
            />
            <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Scripts and HTML tags are automatically stripped.
                </p>
                <span
                    className="font-mono text-xs"
                    style={{ color: isNearLimit ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
                >
                    {remaining.toLocaleString()} / {MAX.toLocaleString()}
                </span>
            </div>
            <FieldError message={error} />
        </div>
    );
}

// ─── AttackSimulationForm (main) ──────────────────────────────────────────────
export default function AttackSimulationForm({
    formValues,
    fieldErrors,
    loading,
    onAddPort,
    onAddPorts,
    onRemovePort,
    onAddMisconfiguration,
    onRemoveMisconfiguration,
    onLogSnippetChange,
    onSubmit,
    onReset,
}) {
    const { openPorts, misconfigurations, logSnippet } = formValues;
    const isEmpty = openPorts.length === 0 && misconfigurations.length === 0 && !logSnippet.trim();

    return (
        <div className="w-full">
            <div className="bg-white shadow-lg border border-gray-100 rounded-xl p-6 w-full">
                <form
                    id="attack-simulation-form"
                    onSubmit={onSubmit}
                    noValidate
                    className="space-y-8"
                >

                {/* ── Section 1: Open Ports ──────────────────────────────────────── */}
                <section aria-labelledby="ports-heading">
                    <SectionHeader
                        number="1"
                        title="Open Ports"
                        subtitle="Type a port and press Enter or comma. Accepts numeric values 1–65535."
                        count={openPorts.length}
                        max={50}
                    />
                    <OpenPortsInput
                        ports={openPorts}
                        onAddPort={onAddPort}
                        onAddPorts={onAddPorts}
                        onRemovePort={onRemovePort}
                        error={fieldErrors.openPorts}
                    />
                </section>

                <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />

                {/* ── Section 2: Misconfigurations ───────────────────────────────── */}
                <section aria-labelledby="misconfig-heading">
                    <SectionHeader
                        number="2"
                        title="Known Misconfigurations"
                        subtitle="Add tags for misconfigurations you're aware of. HTML is stripped automatically."
                        count={misconfigurations.length}
                        max={20}
                    />
                    <MisconfigurationsInput
                        misconfigs={misconfigurations}
                        onAdd={onAddMisconfiguration}
                        onRemove={onRemoveMisconfiguration}
                        error={fieldErrors.misconfigurations}
                    />
                </section>

                <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />

                {/* ── Section 3: Log Snippet ─────────────────────────────────────── */}
                <section aria-labelledby="log-heading">
                    <SectionHeader
                        number="3"
                        title="Log Snippet"
                        subtitle="Optional. Paste raw logs, IDS output, or firewall drops. Max 5,000 characters."
                    />
                    <LogSnippetTextarea
                        value={logSnippet}
                        onChange={onLogSnippetChange}
                        error={fieldErrors.logSnippet}
                    />
                </section>

                <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />

                {/* ── Actions ───────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 pt-1">

                    {/* Submit */}
                    <button
                        type="submit"
                        id="analyze-btn"
                        disabled={loading}
                        className="w-full bg-black text-white py-3 px-2 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                Analyzing…
                            </>
                        ) : (
                            <>
                                <IconSearch />
                                Analyze Threat Chain
                            </>
                        )}
                    </button>

                    {/* Clear */}
                    {!isEmpty && !loading && (
                        <button
                            type="button"
                            id="clear-form-btn"
                            onClick={onReset}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
                        >
                            <IconRefresh />
                            Clear All
                        </button>
                    )}

                    {/* Validation summary hint */}
                    {Object.keys(fieldErrors).length > 0 && (
                        <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                            <IconAlertCircle />
                            Please fix the errors above.
                        </p>
                    )}
                </div>

            </form>
            </div>
        </div>
    );
}
