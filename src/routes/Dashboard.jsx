import { Link } from 'react-router-dom';

// ─── Dashboard ────────────────────────────────────────────────────────────────
// Landing page for the CyberEDT platform.
// Lists available tools and links into them.

const TOOLS = [
    {
        id: 'explain-the-hacker',
        href: '/tool',
        label: 'Explain The Hacker',
        description:
            'Simulate real-world attack chains using the MITRE ATT&CK framework. Understand adversary tactics, techniques, and procedures.',
        badge: 'Active',
        badgeClass: 'badge-green',
        icon: '🎯',
        stats: ['7 Attack Phases', 'MITRE Mapped', 'IOC Generation'],
    },
    {
        id: 'phishing-analyzer',
        href: '#',
        label: 'Phishing URL Analyzer',
        description:
            'Analyze suspicious URLs for phishing indicators using heuristic and reputation-based checks.',
        badge: 'Coming Soon',
        badgeClass: 'badge-yellow',
        icon: '🎣',
        stats: ['Heuristic Checks', 'Domain Reputation', 'Screenshot Capture'],
    },
    {
        id: 'malware-hash',
        href: '#',
        label: 'Malware Hash Lookup',
        description:
            'Cross-reference file hashes against threat intelligence databases like VirusTotal and MalwareBazaar.',
        badge: 'Coming Soon',
        badgeClass: 'badge-yellow',
        icon: '🔎',
        stats: ['Multi-engine', 'YARA Rules', 'Hash Detonation'],
    },
];

export default function Dashboard() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

            {/* Hero */}
            <div className="text-center mb-14 animate-fade-in-up">
                <p className="font-mono text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--color-cyan)' }}>
          // CYBEREDT PLATFORM
                </p>
                <h1
                    className="font-display text-4xl sm:text-5xl font-black mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Cybersecurity{' '}
                    <span className="text-glow-cyan" style={{ color: 'var(--color-cyan)' }}>
                        Intelligence
                    </span>{' '}
                    Tools
                </h1>
                <p
                    className="max-w-xl mx-auto text-base"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    A suite of professional-grade tools for threat simulation, analysis, and defense.
                    Built for red team operators, security researchers, and blue team defenders.
                </p>
            </div>

            {/* Tool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {TOOLS.map((tool, i) => {
                    const isActive = tool.href !== '#';
                    const Card = isActive ? Link : 'div';
                    return (
                        <Card
                            key={tool.id}
                            id={`tool-card-${tool.id}`}
                            to={isActive ? tool.href : undefined}
                            className={`glass-card p-6 flex flex-col gap-4 animate-fade-in-up transition-all duration-300 ${isActive ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-70 cursor-default'
                                }`}
                            style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{ background: 'rgba(0,243,255,0.08)', border: '1px solid var(--color-border)' }}
                                >
                                    {tool.icon}
                                </div>
                                <span className={`badge ${tool.badgeClass}`}>{tool.badge}</span>
                            </div>

                            {/* Body */}
                            <div>
                                <h2
                                    className="font-display text-base font-bold mb-2"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {tool.label}
                                </h2>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                    {tool.description}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                {tool.stats.map((stat) => (
                                    <span
                                        key={stat}
                                        className="font-mono text-xs px-2 py-0.5 rounded"
                                        style={{
                                            background: 'rgba(0,243,255,0.06)',
                                            color: 'var(--color-text-muted)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        {stat}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            {isActive && (
                                <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    <p className="font-mono text-xs font-bold" style={{ color: 'var(--color-cyan)' }}>
                                        Launch Tool →
                                    </p>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

        </div>
    );
}
