/**
 * ResultsPanel.jsx — Section 6
 *
 * Security contract:
 *   - Zero dangerouslySetInnerHTML usage anywhere in this file.
 *   - All text is rendered as React text nodes, which are auto-escaped by React.
 *   - Clipboard writes use navigator.clipboard.writeText() with plain-text only.
 *   - sanitizeText() from the hook guarantees no HTML enters the result object;
 *     this component treats all values as opaque strings and never interpolates
 *     them into HTML attributes that could become injection vectors.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── SVG Icon Set ─────────────────────────────────────────────────────────────

function Ico({ d, size = 16, strokeWidth = 2, fill = 'none', viewBox = '0 0 24 24' }) {
    return (
        <svg width={size} height={size} viewBox={viewBox} fill={fill}
            stroke="currentColor" strokeWidth={strokeWidth}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
        </svg>
    );
}

const Icons = {
    Brain: () => <Ico d={['M9.5 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', 'M14.5 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', 'M2 12c0-4.4 3.6-8 8-8s8 3.6 8 8v8H2v-8z']} />,
    Target: () => <Ico d={['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z']} />,
    Shield: () => <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    Flame: () => <Ico d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
    Puzzle: () => <Ico d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.402 2.402 0 0 1 1.705-.707 2.402 2.402 0 0 1 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.893.527-.967 1.02z" />,
    ChevronDown: () => <Ico d="m6 9 6 6 6-6" />,
    ChevronUp: () => <Ico d="m18 15-6-6-6 6" />,
    Copy: () => <Ico d={['M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M13 4H11a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z']} />,
    Check: () => <Ico d="M20 6 9 17l-5-5" strokeWidth={2.5} />,
    Info: () => <><Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><Ico d={['M12 16v-4', 'M12 8h.01']} /></>,
    Alert: () => <Ico d={['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01']} />,
    Plus: () => <Ico d={['M12 5v14', 'M5 12h14']} />,
    XCircle: () => <><Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><Ico d={['m15 9-6 6', 'm9 9 6 6']} /></>,
    Clock: () => <><Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><Ico d={['M12 6v6l4 2']} /></>,
    RefreshCw: () => <Ico d={['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']} />,
    Download: () => <Ico d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskMeta(score) {
    if (score >= 80) return { label: 'CRITICAL', color: 'var(--color-danger)', bg: '#fef2f2', border: '#fecaca', badge: 'badge-red' };
    if (score >= 60) return { label: 'HIGH', color: 'var(--color-warning)', bg: '#fffbeb', border: '#fde68a', badge: 'badge-yellow' };
    if (score >= 40) return { label: 'MEDIUM', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badge: 'badge-yellow' };
    return { label: 'LOW', color: 'var(--color-success)', bg: '#f0fdf4', border: '#bbf7d0', badge: 'badge-green' };
}

function priorityMeta(priority) {
    const map = {
        critical: { badge: 'badge-red', label: 'Critical' },
        high: { badge: 'badge-yellow', label: 'High' },
        medium: { badge: 'badge-blue', label: 'Medium' },
        low: { badge: 'badge-gray', label: 'Low' },
    };
    return map[priority?.toLowerCase()] || map.medium;
}

function severityMeta(severity) {
    const map = {
        critical: 'badge-red',
        high: 'badge-yellow',
        medium: 'badge-blue',
        low: 'badge-gray',
    };
    return map[severity?.toLowerCase()] || 'badge-gray';
}

function riskLevelMeta(level) {
    const map = {
        critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: 'var(--color-danger)' },
        high: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: 'var(--color-warning)' },
        medium: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', dot: 'var(--color-accent)' },
        low: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', dot: 'var(--color-success)' },
    };
    return map[level?.toLowerCase()] || map.medium;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, id, size = 'sm' }) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(String(text));
            setCopied(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.warn('Clipboard access denied:', err);
        }
    }, [text]);

    const padding = size === 'xs' ? '3px 6px' : '5px 10px';
    const fontSize = size === 'xs' ? '0.68rem' : '0.75rem';

    return (
        <button
            type="button"
            id={id}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            className="inline-flex items-center gap-1 rounded transition-all"
            style={{
                padding,
                fontSize,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                background: copied ? '#f0fdf4' : 'var(--color-surface)',
                border: `1px solid ${copied ? '#bbf7d0' : 'var(--color-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
        >
            {copied ? <Icons.Check /> : <Icons.Copy />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
    const meta = riskMeta(score);
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const [animated, setAnimated] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setAnimated(score), 100);
        return () => clearTimeout(t);
    }, [score]);

    const filled = (animated / 100) * circumference;
    const dash = `${filled} ${circumference - filled}`;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: 130, height: 130 }}>
                <svg width="130" height="130" viewBox="0 0 130 130" aria-label={`Risk score ${score} out of 100`}>
                    {/* Track */}
                    <circle cx="65" cy="65" r={radius} fill="none"
                        stroke="var(--color-border)" strokeWidth="10" />
                    {/* Fill */}
                    <circle cx="65" cy="65" r={radius} fill="none"
                        stroke={meta.color} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={dash}
                        strokeDashoffset={circumference * 0.25}
                        style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono leading-none" style={{ color: meta.color }}>
                        {score}
                    </span>
                    <span className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        / 100
                    </span>
                </div>
            </div>
            <span
                className="badge mt-2"
                style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}
            >
                🔥 {meta.label} RISK
            </span>
        </div>
    );
}

// ─── Collapsible Section Wrapper ──────────────────────────────────────────────

function CollapsibleSection({ id, title, icon, defaultOpen = true, count, badge, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="card overflow-hidden animate-fade-in-up" id={id}>
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                style={{ background: open ? '#fff' : 'var(--color-surface)' }}
                aria-expanded={open}
                onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'var(--color-surface)'; }}
            >
                <div className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                    </span>
                    {count !== undefined && (
                        <span className="badge badge-gray text-xs">{count}</span>
                    )}
                    {badge}
                </div>
                <span style={{ color: 'var(--color-text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    <Icons.ChevronDown />
                </span>
            </button>

            {open && (
                <div
                    className="border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Section 1: Attacker Thought Process & Summary ────────────────────────────

function AttackerThoughtProcess({ summary, confidenceScore, detectionDifficulty, estimatedDwellTime }) {
    return (
        <CollapsibleSection
            id="section-thought-process"
            title="Attacker Thought Process"
            icon={<Icons.Brain />}
            defaultOpen={true}
        >
            <div className="px-5 py-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {summary}
                    </p>
                    <div className="flex-shrink-0">
                        <CopyButton id="copy-summary-btn" text={summary} />
                    </div>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {[
                        { label: 'Confidence Score', value: `${confidenceScore}%`, color: confidenceScore >= 85 ? 'var(--color-success)' : 'var(--color-warning)' },
                        { label: 'Estimated Dwell', value: estimatedDwellTime || 'Unknown' },
                        { label: 'Detection Difficulty', value: detectionDifficulty || 'Unknown' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                            <p className="text-sm font-bold font-mono" style={{ color: color || 'var(--color-text-primary)' }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </CollapsibleSection>
    );
}

// ─── Section 2: Next Likely Move ──────────────────────────────────────────────

function NextLikelyMove({ attackChain }) {
    // Derive "next likely move" = the highest-risk phase (critical first, then high)
    const critical = attackChain.find((p) => p.riskLevel === 'critical');
    const high = attackChain.find((p) => p.riskLevel === 'high');
    const phase = critical || high || attackChain[0];

    if (!phase) return null;

    const meta = riskLevelMeta(phase.riskLevel);
    const topTech = phase.techniques?.[0];

    return (
        <div
            id="section-next-move"
            className="card p-5 animate-fade-in-up"
            style={{ borderColor: meta.border, background: meta.bg }}
        >
            <div className="flex items-center gap-2 mb-3">
                <span style={{ color: meta.dot }}><Icons.Target /></span>
                <h3 className="text-sm font-bold" style={{ color: meta.color }}>
                    🎯 Next Likely Move
                </h3>
                <span className="ml-auto font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 700 }}>
                    {phase.riskLevel?.toUpperCase()} RISK
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {phase.phase}
                    </span>
                    {phase.mitreId && (
                        <span className="badge badge-blue font-mono text-xs">{phase.mitreId}</span>
                    )}
                    {phase.timeEstimate && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            <Icons.Clock /> {phase.timeEstimate}
                        </span>
                    )}
                </div>

                {topTech && (
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-semibold font-mono text-xs" style={{ color: meta.color }}>
                            {topTech.id}
                        </span>
                        {' — '}
                        <span className="font-medium">{topTech.name}:</span>
                        {' '}{topTech.description}
                    </div>
                )}

                {phase.techniques?.length > 1 && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        + {phase.techniques.length - 1} additional technique{phase.techniques.length > 2 ? 's' : ''} in this phase
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Section 3: Attack Stages (Collapsible Timeline) ─────────────────────────

function PhaseCard({ phase, index, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    const meta = riskLevelMeta(phase.riskLevel);

    return (
        <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${open ? meta.border : 'var(--color-border)'}`, transition: 'border-color 0.2s' }}
        >
            {/* Phase Header */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: open ? meta.bg : '#fff' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = meta.bg; }}
                onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = '#fff'; }}
            >
                {/* Phase number */}
                <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: meta.dot, color: '#fff' }}
                    aria-label={`Phase ${index + 1}`}
                >
                    {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {phase.phase}
                        </span>
                        {phase.mitreId && (
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                {phase.mitreId}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {phase.timeEstimate && (
                        <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Icons.Clock /> {phase.timeEstimate}
                        </span>
                    )}
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                        {phase.riskLevel?.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(0)' : 'rotate(-90deg)' }}>
                        <Icons.ChevronDown />
                    </span>
                </div>
            </button>

            {/* Techniques (expanded) */}
            {open && phase.techniques?.length > 0 && (
                <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: meta.border, background: '#fff' }}>
                    {phase.techniques.map((tech, ti) => (
                        <div key={ti} className="flex items-start gap-3">
                            <span
                                className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                            >
                                {tech.id}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                    {tech.name}
                                </p>
                                {tech.description && (
                                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        {tech.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AttackStagesSection({ attackChain }) {
    const [allOpen, setAllOpen] = useState(false);
    const [key, setKey] = useState(0);

    const toggleAll = () => {
        setAllOpen((p) => !p);
        setKey((k) => k + 1);
    };

    return (
        <div id="section-attack-stages" className="card overflow-hidden animate-fade-in-up">
            {/* Custom header — avoids nested button by using a div row */}
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: '#fff', borderBottom: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--color-accent)' }}><Icons.Puzzle /></span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        Attack Stages
                    </span>
                    <span className="badge badge-gray">{attackChain.length}</span>
                </div>
                <button
                    type="button"
                    id="toggle-all-phases-btn"
                    onClick={toggleAll}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{
                        color: 'var(--color-accent)', fontWeight: 500,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 8px',
                    }}
                >
                    {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
            </div>

            <div className="p-5 space-y-2">
                {attackChain.map((phase, i) => (
                    <PhaseCard
                        key={`${key}-${i}`}
                        phase={phase}
                        index={i}
                        defaultOpen={allOpen || i === 0}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Section 4: Indicators of Compromise ─────────────────────────────────────

function IOCRow({ ioc, index }) {
    return (
        <tr
            id={`ioc-row-${index}`}
            style={{ borderBottom: '1px solid var(--color-border)' }}
        >
            <td className="px-4 py-2.5">
                <span className={`badge ${severityMeta(ioc.severity)}`}>
                    {ioc.severity?.toUpperCase()}
                </span>
            </td>
            <td className="px-4 py-2.5 text-xs text-muted">{ioc.type}</td>
            <td className="px-4 py-2.5">
                <span
                    className="font-mono text-xs break-all"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {ioc.value}
                </span>
            </td>
            <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {ioc.label}
            </td>
            <td className="px-4 py-2.5 text-right">
                <CopyButton
                    id={`copy-ioc-${index}`}
                    text={ioc.value}
                    size="xs"
                />
            </td>
        </tr>
    );
}

function IOCSection({ iocList }) {
    if (!iocList?.length) return null;
    return (
        <CollapsibleSection
            id="section-ioc"
            title="Indicators of Compromise"
            icon={<Icons.Alert />}
            count={iocList.length}
            defaultOpen={true}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" aria-label="Indicators of Compromise">
                    <thead>
                        <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                            {['Severity', 'Type', 'Value', 'Label', ''].map((h) => (
                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {iocList.map((ioc, i) => (
                            <IOCRow key={i} ioc={ioc} index={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </CollapsibleSection>
    );
}

// ─── Section 5: Defense Recommendations ──────────────────────────────────────

function MitigationCard({ m, index }) {
    const meta = priorityMeta(m.priority);
    return (
        <div
            id={`mitigation-${index}`}
            className="p-4 rounded-lg"
            style={{ background: '#fff', border: '1px solid var(--color-border)' }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {m.id && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                            {m.id}
                        </span>
                    )}
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {m.title}
                    </span>
                </div>
                <span className={`badge ${meta.badge} flex-shrink-0`}>{meta.label}</span>
            </div>
            {m.description && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {m.description}
                </p>
            )}
        </div>
    );
}

function MitigationsSection({ mitigations }) {
    if (!mitigations?.length) return null;

    // Sort by priority: critical → high → medium → low
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...mitigations].sort(
        (a, b) => (order[a.priority?.toLowerCase()] ?? 4) - (order[b.priority?.toLowerCase()] ?? 4)
    );

    return (
        <CollapsibleSection
            id="section-mitigations"
            title="Defense Recommendations"
            icon={<Icons.Shield />}
            count={sorted.length}
            defaultOpen={true}
        >
            <div className="p-5 space-y-3">
                {sorted.map((m, i) => (
                    <MitigationCard key={i} m={m} index={i} />
                ))}
            </div>
        </CollapsibleSection>
    );
}

// ─── Affected Assets ──────────────────────────────────────────────────────────

function AffectedAssetsBar({ assets }) {
    if (!assets?.length) return null;
    return (
        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Affected Assets:
            </span>
            {assets.map((a) => (
                <span key={a} className="badge badge-gray">{a}</span>
            ))}
        </div>
    );
}

// ─── Top Summary Bar ──────────────────────────────────────────────────────────

function TopSummaryBar({ result, onNewAnalysis }) {
    const meta = riskMeta(result.riskScore);
    const date = new Date(result.timestamp).toLocaleString();

    // Build plain-text report for clipboard export
    const buildReport = useCallback(() => {
        const lines = [
            `CyberEDT — Explain The Hacker Report`,
            `Simulation ID: ${result.id}`,
            `Date: ${date}`,
            `Risk Score: ${result.riskScore}/100 (${meta.label})`,
            `Confidence: ${result.confidenceScore}%`,
            ``,
            `SUMMARY`,
            result.summary,
            ``,
            `ATTACK CHAIN`,
            ...result.attackChain.map((p, i) =>
                `  ${i + 1}. ${p.phase} [${p.mitreId}] — ${p.riskLevel?.toUpperCase()} — ${p.timeEstimate}\n` +
                p.techniques.map((t) => `     • ${t.id}: ${t.name} — ${t.description}`).join('\n')
            ),
            ``,
            `INDICATORS OF COMPROMISE`,
            ...result.iocList.map((ioc) => `  [${ioc.severity?.toUpperCase()}] ${ioc.type}: ${ioc.value} (${ioc.label})`),
            ``,
            `DEFENSE RECOMMENDATIONS`,
            ...result.mitigations.map((m) => `  [${m.priority?.toUpperCase()}] ${m.id} ${m.title}: ${m.description}`),
            ``,
            `Dwell Time: ${result.estimatedDwellTime}  |  Detection: ${result.detectionDifficulty}`,
            `Affected: ${result.affectedAssets.join(', ')}`,
        ];
        return lines.join('\n');
    }, [result, date, meta]);

    return (
        <div className="card p-5 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Risk gauge */}
                <RiskGauge score={result.riskScore} />

                {/* Meta */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div>
                        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                            Threat Analysis Complete
                        </h2>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                            ID: {result.id} · {date}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'Attack Phases', val: result.attackChain.length },
                            { label: 'IOCs Identified', val: result.iocList.length },
                            { label: 'Mitigations', val: result.mitigations.length },
                            { label: 'Confidence', val: `${result.confidenceScore}%` },
                        ].map(({ label, val }) => (
                            <div key={label} className="text-center p-2 rounded-lg"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <p className="text-base font-bold font-mono" style={{ color: 'var(--color-accent)' }}>{val}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                        type="button"
                        id="new-analysis-btn"
                        onClick={onNewAnalysis}
                        className="btn-primary whitespace-nowrap"
                        style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                    >
                        <Icons.RefreshCw />
                        New Analysis
                    </button>
                    <CopyButton id="copy-full-report-btn" text={buildReport()} />
                </div>
            </div>
        </div>
    );
}

// ─── ResultsPanel (Root) ──────────────────────────────────────────────────────

export default function ResultsPanel({ result, onNewAnalysis }) {
    if (!result) return null;

    return (
        <div className="space-y-4" aria-label="Analysis Results" role="region">

            {/* ① Top bar — risk gauge + stats + actions */}
            <TopSummaryBar result={result} onNewAnalysis={onNewAnalysis} />

            {/* ② 🎯 Next Likely Move — computed highlight */}
            <NextLikelyMove attackChain={result.attackChain} />

            {/* ③ 🧠 Attacker Thought Process */}
            <AttackerThoughtProcess
                summary={result.summary}
                confidenceScore={result.confidenceScore}
                detectionDifficulty={result.detectionDifficulty}
                estimatedDwellTime={result.estimatedDwellTime}
            />

            {/* ④ 🧩 Attack Stages — collapsible MITRE chain */}
            {result.attackChain.length > 0 && (
                <AttackStagesSection attackChain={result.attackChain} />
            )}

            {/* ⑤ IOCs */}
            <IOCSection iocList={result.iocList} />

            {/* ⑥ 🛡 Defense Recommendations */}
            <MitigationsSection mitigations={result.mitigations} />

            {/* ⑦ Footer — affected assets */}
            {result.affectedAssets.length > 0 && (
                <div className="card px-5 py-4 animate-fade-in-up">
                    <AffectedAssetsBar assets={result.affectedAssets} />
                </div>
            )}

        </div>
    );
}
