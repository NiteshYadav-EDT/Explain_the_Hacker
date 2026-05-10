import { useEffect, useRef, lazy, Suspense, useState } from 'react';
import useExplainHacker from './useExplainHacker';
import AttackSimulationForm from './AttackSimulationForm';
import ResultsPanel from './ResultsPanel';

// Lazy-load the visualization bundle (Recharts ~250 KB) — only fetched after results appear
const ThreatVisualization = lazy(() => import('./ThreatVisualization'));

function IconAlertCircle() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
function IconX() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function IconHistory() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function IconShield() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
    return (
        <header className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center">
                <p className="text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Input your system's exposed ports, known misconfigurations, and log snippets.
                    Get a full MITRE ATT&amp;CK attack-chain simulation, IOC mapping, and
                    actionable mitigations — instantly.
                </p>
            </div>
            <div className="grid grid-cols-4 gap-10 text-center mt-6">
                {[
                    { label: 'Attack Phases', value: '7+' },
                    { label: 'MITRE Techniques', value: '200+' },
                    { label: 'IOC Types', value: '5' },
                    { label: 'Threat Vectors', value: '8' },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{value}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>
        </header>
    );
}

// ─── Loading State ────────────────────────────────────────────────────────────
function LoadingState() {
    return (
        <div className="mt-10 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-4">
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <p className="font-mono tracking-widest text-sm" style={{ color: 'var(--color-accent)' }}>
                    ANALYZING THREAT CHAIN…
                </p>
                <div className="w-64 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                    <div className="h-full rounded-full progress-bar" style={{ background: 'var(--color-accent)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Mapping adversary tactics to MITRE ATT&amp;CK…
                </p>
            </div>
        </div>
    );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
    return (
        <div className="card p-4 flex items-start gap-3 animate-fade-in-up" style={{ borderColor: '#fecaca', background: '#fef2f2' }} role="alert">
            <span style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 1 }}><IconAlertCircle /></span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#991b1b' }}>Analysis Failed</p>
                <p className="text-xs" style={{ color: '#b91c1c' }}>{message}</p>
            </div>
            {onDismiss && (
                <button id="error-dismiss-btn" onClick={onDismiss} aria-label="Dismiss error"
                    className="p-1 rounded transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    <IconX />
                </button>
            )}
        </div>
    );
}

// ─── History Sidebar ──────────────────────────────────────────────────────────
function HistorySidebar({ history }) {
    if (!history.length) return null;
    const [activeTab, setActiveTab] = useState('all');
    const riskColor = (s) => s >= 80 ? 'var(--color-danger)' : s >= 60 ? 'var(--color-warning)' : 'var(--color-success)';
    
    const filteredHistory = activeTab === 'all' ? history : history.filter(entry => {
        if (activeTab === 'high') return entry.riskScore >= 80;
        if (activeTab === 'medium') return entry.riskScore >= 60 && entry.riskScore < 80;
        if (activeTab === 'low') return entry.riskScore < 60;
        return true;
    });

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="card p-4 sticky" style={{ top: '5.5rem' }}>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}><IconHistory /></span>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
                        Recent Analyses
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-black rounded-lg">
                    {[
                        { id: 'all', label: 'All', count: history.length },
                        { id: 'high', label: 'High', count: history.filter(h => h.riskScore >= 80).length },
                        { id: 'medium', label: 'Medium', count: history.filter(h => h.riskScore >= 60 && h.riskScore < 80).length },
                        { id: 'low', label: 'Low', count: history.filter(h => h.riskScore < 60).length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1 text-xs" style={{ opacity: 0.7 }}>
                                    ({tab.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-2">
                    {filteredHistory.length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                            No {activeTab === 'all' ? '' : activeTab + ' risk '} analyses found
                        </p>
                    ) : (
                        filteredHistory.map((entry) => (
                            <div key={entry.id} className="p-3 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="badge badge-gray">{entry.portCount} ports</span>
                                    <span className="text-sm font-bold font-mono" style={{ color: riskColor(entry.riskScore) }}>{entry.riskScore}</span>
                                </div>
                                <p className="text-xs leading-snug line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{entry.summary}</p>
                                <p className="font-mono text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}

// ─── ExplainTheHacker ────────────────────────────────────────────────────────
export default function ExplainTheHacker() {
    const {
        loading, error, result, formValues, fieldErrors, history,
        addPort, addPorts, removePort,
        addMisconfiguration, removeMisconfiguration,
        setLogSnippet,
        handleSubmit, resetForm, clearResult,
    } = useExplainHacker();

    const resultsRef = useRef(null);
    useEffect(() => {
        if (result && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [result]);

    return (
        <div className="flex-grow container mx-auto px-6 py-12 relative z-10">
            <HeroSection />

            <div className="flex gap-8">
                <div className="flex-1 min-w-0 space-y-6">

                    {error && <ErrorBanner message={error} onDismiss={clearResult} />}

                    <section aria-label="Attack simulation configuration">
                        <AttackSimulationForm
                            formValues={formValues}
                            fieldErrors={fieldErrors}
                            loading={loading}
                            onAddPort={addPort}
                            onAddPorts={addPorts}
                            onRemovePort={removePort}
                            onAddMisconfiguration={addMisconfiguration}
                            onRemoveMisconfiguration={removeMisconfiguration}
                            onLogSnippetChange={setLogSnippet}
                            onSubmit={handleSubmit}
                            onReset={resetForm}
                        />
                    </section>

                    {loading && (
                        <section aria-label="Analysis in progress" aria-live="polite">
                            <LoadingState />
                        </section>
                    )}

                    {result && !loading && (
                        <section ref={resultsRef} aria-label="Analysis results" aria-live="polite">
                            <ResultsPanel result={result} onNewAnalysis={clearResult} />
                            {/* Threat Visualization — lazy-loaded after results arrive */}
                            <Suspense fallback={
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div className="h-[280px] rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
                                        <div className="lg:col-span-2 h-[280px] rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
                                    </div>
                                    <div className="h-[280px] rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
                                </div>
                            }>
                                <ThreatVisualization result={result} />
                            </Suspense>
                        </section>
                    )}
                </div>

                <HistorySidebar history={history} />
            </div>

        </div>
    );
}
