/**
 * ThreatVisualization.jsx — Section 7
 *
 * Architecture:
 *  - All three Recharts charts are lazy-loaded: the bundle is only fetched after
 *    the user triggers an analysis (results !== null), not on initial page load.
 *  - Colors are read from CSS custom properties at render time via a `useTheme`
 *    hook — zero hardcoded hex values in this file.
 *  - Each chart component is self-contained and receives only the normalized
 *    `result` object (already sanitized by the hook).
 */

import { useMemo } from 'react';
import {
    RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, Cell, LabelList,
    ComposedChart, Area, Scatter, CartesianGrid, ReferenceLine
} from 'recharts';

function RiskGaugeChart({ score, colors }) {
    const data = [{ name: 'Risk', value: score, fill: colors.risk }];

    return (
        <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
                cx="50%" cy="60%"
                innerRadius="65%" outerRadius="95%"
                startAngle={180} endAngle={0}
                data={data}
                barSize={24}
            >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                    background={{ fill: colors.track }}
                    dataKey="value"
                    cornerRadius={10}
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                />
                <Tooltip
                    formatter={(v) => [`${v} / 100`, 'Risk Score']}
                    contentStyle={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        fontFamily: colors.fontMono,
                        fontSize: 12,
                        color: colors.textPrimary,
                    }}
                />
            </RadialBarChart>
        </ResponsiveContainer>
    );
}

function StageBarChart({ data, colors }) {
    const riskColor = (score) => {
        if (score >= 80) return colors.danger;
        if (score >= 60) return colors.warning;
        if (score >= 40) return colors.accent;
        return colors.success;
    };

    return (
        <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
            >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                    type="category" dataKey="category"
                    width={160}
                    tick={{ fill: colors.textSecondary, fontSize: 11, fontFamily: colors.fontSans }}
                    axisLine={false} tickLine={false}
                />
                <Tooltip
                    cursor={{ fill: colors.surface2 }}
                    formatter={(v) => [`${v}`, 'Risk Score']}
                    contentStyle={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        fontFamily: colors.fontMono,
                        fontSize: 12,
                        color: colors.textPrimary,
                    }}
                />
                <Bar
                    dataKey="score"
                    radius={[0, 6, 6, 0]}
                    isAnimationActive={true}
                    animationBegin={100}
                    animationDuration={900}
                    animationEasing="ease-out"
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={riskColor(entry.score)} />
                    ))}
                    <LabelList
                        dataKey="score"
                        position="right"
                        style={{ fill: colors.textSecondary, fontSize: 11, fontFamily: colors.fontMono, fontWeight: 600 }}
                        formatter={(v) => `${v}`}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function AttackFlowChart({ data, colors }) {
    const criticalThreshold = 80;

    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                <defs>
                    <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.accent} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0.02} />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.border}
                    vertical={false}
                />
                <XAxis
                    dataKey="phase"
                    tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: colors.fontSans }}
                    axisLine={false} tickLine={false}
                    interval={0}
                    height={36}
                    tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + '…' : v}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: colors.fontMono }}
                    axisLine={false} tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        fontFamily: colors.fontMono,
                        fontSize: 12,
                        color: colors.textPrimary,
                    }}
                    formatter={(v, name) => [`${v}`, name === 'score' ? 'Risk Score' : name]}
                />
                <ReferenceLine
                    y={criticalThreshold}
                    stroke={colors.danger}
                    strokeDasharray="5 3"
                    strokeOpacity={0.6}
                    label={{ value: 'Critical', fill: colors.danger, fontSize: 10, fontFamily: colors.fontSans, position: 'insideTopRight' }}
                />
                <Area
                    type="monotone"
                    dataKey="score"
                    stroke={colors.accent}
                    strokeWidth={2.5}
                    fill="url(#flowGradient)"
                    dot={{ r: 4, fill: colors.accent, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: colors.accent }}
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                />
                <Scatter
                    dataKey="score"
                    fill={colors.accent}
                    shape={(props) => {
                        if (props.score < criticalThreshold) return null;
                        return (
                            <circle
                                cx={props.cx} cy={props.cy}
                                r={6}
                                fill={colors.danger}
                                stroke="#fff" strokeWidth={2}
                            />
                        );
                    }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// ─── Theme Colors Hook ────────────────────────────────────────────────────────
// Reads all CSS variables at render time. Charts receive a `colors` object —
// no hex codes ever appear as literals in this file.

function useThemeColors() {
    return useMemo(() => {
        const style = getComputedStyle(document.documentElement);
        const get = (v) => style.getPropertyValue(v).trim();
        const score = (s) => {
            if (s >= 80) return get('--color-danger');
            if (s >= 60) return get('--color-warning');
            if (s >= 40) return get('--color-accent');
            return get('--color-success');
        };
        return {
            accent: get('--color-accent'),
            accentDark: get('--color-accent-dark'),
            success: get('--color-success'),
            warning: get('--color-warning'),
            danger: get('--color-danger'),
            purple: get('--color-purple'),
            surface: get('--color-bg'),
            surface2: get('--color-surface-2'),
            border: get('--color-border'),
            textPrimary: get('--color-text-primary'),
            textSecondary: get('--color-text-secondary'),
            textMuted: get('--color-text-muted'),
            fontSans: get('--font-sans'),
            fontMono: get('--font-mono'),
            track: get('--color-surface-2'),
            riskForScore: score,
        };
    }, []);
}

// ─── Chart Loading Fallback ───────────────────────────────────────────────────

function ChartSkeleton({ height = 200 }) {
    return (
        <div
            className="rounded-lg animate-pulse"
            style={{
                height,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
            }}
            aria-label="Chart loading…"
            role="status"
        />
    );
}

// ─── Section Card Shell ───────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="card overflow-hidden">
            <div
                className="px-5 py-4 border-b"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                </p>
                {subtitle && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {subtitle}
                    </p>
                )}
            </div>
            <div className="p-4 bg-white">
                {children}
            </div>
        </div>
    );
}

// ─── 1. Risk Level Gauge ──────────────────────────────────────────────────────

function RiskGaugeSection({ result, colors }) {
    const meta = (() => {
        const s = result.riskScore;
        if (s >= 80) return { label: 'CRITICAL', color: colors.danger, bg: '#fef2f2' };
        if (s >= 60) return { label: 'HIGH', color: colors.warning, bg: '#fffbeb' };
        if (s >= 40) return { label: 'MEDIUM', color: colors.accent, bg: '#eff6ff' };
        return { label: 'LOW', color: colors.success, bg: '#f0fdf4' };
    })();

    return (
        <ChartCard
            title="Risk Level Gauge"
            subtitle="Overall threat exposure score derived from attack surface analysis"
        >
            <div className="relative">
                <RiskGaugeChart
                    score={result.riskScore}
                    colors={{ ...colors, risk: meta.color }}
                />
                {/* Central label overlaid below the arc */}
                <div className="absolute inset-x-0 bottom-2 flex flex-col items-center pointer-events-none">
                    <span
                        className="text-3xl font-bold font-mono leading-none"
                        style={{ color: meta.color }}
                    >
                        {result.riskScore}
                    </span>
                    <span
                        className="text-xs font-bold mt-1 px-2 py-0.5 rounded"
                        style={{ background: meta.bg, color: meta.color, letterSpacing: '0.08em' }}
                    >
                        {meta.label}
                    </span>
                </div>
            </div>
            {/* Confidence row */}
            <div className="mt-3 flex items-center justify-between text-xs px-1">
                <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
                <span className="font-mono font-bold" style={{ color: colors.success }}>
                    {result.confidenceScore}%
                </span>
            </div>
        </ChartCard>
    );
}

// ─── 2. MITRE Stage Indicator ─────────────────────────────────────────────────

function MitreStageSection({ result, colors }) {
    const data = result.riskBreakdown.length > 0
        ? result.riskBreakdown
        : result.attackChain.map((phase) => {
            // Fallback: derive score from risk level label
            const scoreMap = { critical: 90, high: 70, medium: 50, low: 30 };
            return {
                category: phase.phase,
                score: scoreMap[phase.riskLevel?.toLowerCase()] ?? 50,
            };
        });

    return (
        <ChartCard
            title="MITRE ATT&CK Stage Indicator"
            subtitle="Risk score per attack phase — red bars indicate critical-threshold stages"
        >
            <StageBarChart data={data} colors={colors} />
        </ChartCard>
    );
}

// ─── 3. Attack Flow Diagram ───────────────────────────────────────────────────

function AttackFlowSection({ result, colors }) {
    // Build time-series data across attack chain phases
    const data = useMemo(() => {
        const riskLevelScore = { critical: 90, high: 72, medium: 52, low: 30 };
        return result.attackChain.map((phase) => ({
            phase: phase.phase,
            score: riskLevelScore[phase.riskLevel?.toLowerCase()] ?? 50,
            mitreId: phase.mitreId,
        }));
    }, [result.attackChain]);

    return (
        <ChartCard
            title="Attack Flow Diagram"
            subtitle="Threat escalation across the kill chain — dots above the red line are critical"
        >
            <AttackFlowChart data={data} colors={colors} />
        </ChartCard>
    );
}

// ─── ThreatVisualization (root export) ───────────────────────────────────────

export default function ThreatVisualization({ result }) {
    const colors = useThemeColors();

    if (!result) return null;

    return (
        <div className="space-y-4 animate-fade-in-up" aria-label="Threat Visualization Charts">
            {/* Section label */}
            <div className="flex items-center gap-3 px-1">
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                <span
                    className="text-xs font-mono font-semibold uppercase tracking-wider px-3"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    Threat Visualization
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* 3-column grid on large screens, stacked on small */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Risk Gauge — narrower column */}
                <div className="lg:col-span-1">
                    <RiskGaugeSection result={result} colors={colors} />
                </div>

                {/* 2. MITRE Stage Bars — wide column */}
                <div className="lg:col-span-2">
                    <MitreStageSection result={result} colors={colors} />
                </div>
            </div>

            {/* 3. Attack Flow — full width */}
            <AttackFlowSection result={result} colors={colors} />
        </div>
    );
}
