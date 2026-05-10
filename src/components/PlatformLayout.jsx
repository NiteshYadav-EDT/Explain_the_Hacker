// ─── PlatformLayout ───────────────────────────────────────────────────────────
// Matches CyberEDT brand exactly: white bg, black pill logo, subtle border nav

import logo from '@/assets/EDTlogo.jpg';

export default function PlatformLayout({ children }) {
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
        >
            {/* ── Background decorative blobs (same as phishing analyzer) ─────── */}
            <div
                className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
                aria-hidden="true"
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-100" />
                <div
                    className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl"
                    style={{ background: 'rgba(59,130,246,0.04)' }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-3xl"
                    style={{ background: 'rgba(59,130,246,0.03)' }}
                />
            </div>

            {/* ── Navbar ──────────────────────────────────────────────────────── */}
            <nav
                className="sticky top-0 z-50 border-b"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderColor: 'var(--color-border)',
                }}
            >
                <div className="container mx-auto px-8 py-4 flex justify-between items-center">

                    {/* Left side - Page title and subtitle */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-black mb-1">
                            Explain the Hacker
                        </h1>
                        <p className="text-sm text-gray-600">
                            CyberEDT • Threat Simulation Engine
                        </p>
                    </div>

                    {/* Right side - CyberEDT logo */}
                    <a href="/" className="flex items-center gap-2">
                        <img 
                            src={logo} 
                            alt="CyberEDT Logo" 
                            className="h-8 w-auto"
                        />
                    </a>

                </div>
            </nav>

            {/* ── Ticker — live threat simulation ticker ────────────────────────── */}
            <div
                className="border-b py-2 overflow-hidden relative z-40"
                style={{
                    background: 'rgba(249,250,251,0.6)',
                    borderColor: 'rgba(229,231,235,0.6)',
                }}
            >
                <div className="ticker-wrap">
                    <div className="ticker font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {[
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'Ransomware — Finance sector lateral movement blocked' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'APT group — Spear-phishing campaign against healthcare' },
                            { label: 'CRITICAL', color: 'var(--color-danger)', text: 'Nation-state — Zero-day exploit targeting energy grid' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'Supply chain attack — Trojanized software update' },
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'Credential theft — Brute-force attack on government VPN' },
                            { label: 'CRITICAL', color: 'var(--color-danger)', text: 'Data exfiltration — 2.4M records via cloud storage' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'Insider threat — Privileged account data access anomaly' },
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'C2 traffic — Cobalt Strike beacon detected and isolated' },
                        ].concat([
                            // duplicate for seamless infinite scroll
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'Ransomware — Finance sector lateral movement blocked' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'APT group — Spear-phishing campaign against healthcare' },
                            { label: 'CRITICAL', color: 'var(--color-danger)', text: 'Nation-state — Zero-day exploit targeting energy grid' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'Supply chain attack — Trojanized software update' },
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'Credential theft — Brute-force attack on government VPN' },
                            { label: 'CRITICAL', color: 'var(--color-danger)', text: 'Data exfiltration — 2.4M records via cloud storage' },
                            { label: 'DETECTED', color: 'var(--color-warning)', text: 'Insider threat — Privileged account data access anomaly' },
                            { label: 'MITIGATED', color: 'var(--color-success)', text: 'C2 traffic — Cobalt Strike beacon detected and isolated' },
                        ]).map((item, i) => (
                            <span key={i} className="ticker-item">
                                <span style={{ color: item.color, fontWeight: 600 }}>{item.label} </span>
                                {item.text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Page Content ────────────────────────────────────────────────── */}
            <main className="flex-1">
                {children}
            </main>

            {/* ── Footer — identical to phishing analyzer ──────────────────────── */}
            <footer
                className="mt-auto py-8 text-center text-sm border-t"
                style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-secondary)',
                }}
            >
                <div className="container mx-auto px-6">
                    <p className="mb-2">© 2024 CyberEDT. All rights reserved.</p>
                    <p className="text-xs" style={{ opacity: 0.6 }}>
                        Disclaimer: This tool is for authorized security research and educational purposes only.
                        Always obtain written permission before testing any system.
                    </p>
                </div>
            </footer>

        </div>
    );
}
