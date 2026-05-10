/**
 * analysisAPI.js — CyberEDT Analysis API Service Layer
 *
 * Architecture decisions:
 *  - JWT is pulled from the Zustand auth store at request time (never hardcoded).
 *  - No API keys are stored or exposed in this file or any env var readable by the browser.
 *    The backend validates the session token server-side before proxying to any AI/intel APIs.
 *  - Axios instance is created once; interceptors attach auth and normalize errors.
 *  - Timeout: 10 seconds (per spec).
 */

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.cyberedt.io/v1',
    timeout: 10_000,  // 10 seconds — per Section 4 spec
    headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'CyberEDT-ExplainTheHacker/1.0',
    },
    withCredentials: false,  // credentials live in the Authorization header only
});

// ─── Request Interceptor — attach JWT from Zustand store ─────────────────────
//
// We call useAuthStore.getState() (non-hook form) so this works outside React
// components without violating Rules of Hooks.
// The sessionToken (short-lived JWT) is preferred over the apiKey.
// NEITHER value is an API key to any third-party service — it is a CyberEDT
// session credential issued after the user authenticates on the backend.

apiClient.interceptors.request.use(
    (config) => {
        try {
            const { sessionToken, apiKey } = useAuthStore.getState();
            const token = sessionToken || apiKey;
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.debug('Auth store not yet hydrated:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Centralized Error Formatter ──────────────────────────────────────────────
//
// Produces a consistent ApiError object for all failure modes.
// Components only ever see { message, code, status, retryAfter? }.

function buildApiError(axiosError) {
    const status = axiosError?.response?.status;
    const serverMsg = axiosError?.response?.data?.message
        || axiosError?.response?.data?.error;
    const retryAfter = axiosError?.response?.headers?.['retry-after'];

    let message;
    let code;

    switch (status) {
        case 400:
            message = serverMsg || 'Invalid request. Please check your inputs.';
            code = 'BAD_REQUEST';
            break;

        case 401:
            message = 'Authentication required. Please verify your CyberEDT session.';
            code = 'UNAUTHORIZED';
            // Optionally clear expired session from store without importing React hooks
            try { useAuthStore.getState().clearSession?.(); } catch (err) {
                console.error('Failed to clear session:', err);
            }
            break;

        case 403:
            message = 'Access denied. Your account may not have permission for this analysis.';
            code = 'FORBIDDEN';
            break;

        case 422:
            message = serverMsg || 'Validation failed on the server. Please review your inputs.';
            code = 'VALIDATION_ERROR';
            break;

        case 429: {
            const waitSecs = retryAfter ? parseInt(retryAfter, 10) : null;
            message = waitSecs
                ? `Rate limit exceeded. Please wait ${waitSecs} second${waitSecs !== 1 ? 's' : ''} before retrying.`
                : 'Too many requests. Please slow down and try again shortly.';
            code = 'RATE_LIMITED';
            break;
        }

        case 500:
            message = 'The analysis engine encountered an internal error. Please try again.';
            code = 'SERVER_ERROR';
            break;

        case 502:
        case 503:
        case 504:
            message = 'The analysis service is temporarily unavailable. Please try again in a moment.';
            code = 'SERVICE_UNAVAILABLE';
            break;

        default:
            if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
                message = 'The request timed out (10 s). The analysis engine may be overloaded — please retry.';
                code = 'TIMEOUT';
            } else if (!axiosError.response) {
                message = 'No response from server. Check your internet connection and try again.';
                code = 'NETWORK_ERROR';
            } else {
                message = serverMsg || axiosError.message || 'An unexpected error occurred.';
                code = 'UNKNOWN_ERROR';
            }
    }

    const err = new Error(message);
    err.code = code;
    err.status = status ?? null;
    err.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
    return err;
}

// ─── Response Interceptor — normalize all errors ──────────────────────────────

apiClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(buildApiError(error))
);

// ─── API Methods ──────────────────────────────────────────────────────────────

/**
 * Run an attack chain analysis.
 *
 * @param {{ openPorts: string[], misconfigurations: string[], logSnippet: string }} payload
 * @param {AbortSignal} [signal]  AbortController signal for cancellation
 * @returns {Promise<AnalysisResult>}
 */
export async function runAttackSimulation(payload, signal) {
    const response = await apiClient.post('/analyze/attack-chain', payload, { signal });
    return response.data;
}

/**
 * Fetch MITRE ATT&CK techniques for a given list of ports.
 *
 * @param {string[]} openPorts
 * @returns {Promise<MitreTechnique[]>}
 */
export async function getMitreTechniques(openPorts) {
    const response = await apiClient.get('/mitre/techniques', {
        params: { ports: openPorts.join(',') },
    });
    return response.data;
}

/**
 * Fetch threat intel context for a CVE ID.
 *
 * @param {string} cveId  e.g. 'CVE-2024-12345'
 * @returns {Promise<CveContext>}
 */
export async function getCveContext(cveId) {
    const response = await apiClient.get(`/intel/cve/${cveId}`);
    return response.data;
}

/**
 * Lightweight health-check — useful for status indicators.
 *
 * @returns {Promise<{ status: 'ok'|'degraded', latencyMs: number }>}
 */
export async function checkApiHealth() {
    const t0 = Date.now();
    const response = await apiClient.get('/health');
    return { ...response.data, latencyMs: Date.now() - t0 };
}

// ─── Mock Fallback (VITE_USE_MOCK=true) ───────────────────────────────────────
// Used during local development when no real backend is available.
// Simulates realistic latency and derives results from actual form inputs.

export async function runAttackSimulationMock(payload, signal) {
    // Artificial latency tied to abort signal
    await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 2200);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        });
    });

    const { openPorts = [], misconfigurations = [], logSnippet = '' } = payload;

    const portCount = openPorts.length;
    const miscCount = misconfigurations.length;
    const hasLog = logSnippet.trim().length > 0;
    const hasRisky = openPorts.some((p) =>
        ['21', '22', '23', '25', '3389', '5900', '27017', '6379'].includes(p)
    );

    const riskScore = Math.min(
        40 + portCount * 3 + miscCount * 4 + (hasRisky ? 15 : 0) + (hasLog ? 6 : 0),
        99
    );

    const portList = openPorts.slice(0, 3).join(', ') + (openPorts.length > 3 ? '…' : '');
    const miscSample = misconfigurations[0] || 'known misconfiguration';

    return {
        id: `sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        riskScore,
        confidenceScore: 88 + Math.min(miscCount, 5),
        summary:
            `Analysis of ${portCount} exposed port(s) (${portList || 'none'}) and ` +
            `${miscCount} misconfiguration(s) reveals a high-probability attack surface. ` +
            `The presence of "${miscSample}" significantly lowers the effort required for initial access.` +
            (hasLog ? ' Log activity corroborates reconnaissance indicators.' : ''),

        attackChain: [
            {
                phase: 'Reconnaissance', mitreId: 'TA0043',
                techniques: [
                    { id: 'T1595', name: 'Active Scanning', description: `Attacker scans exposed ports: ${portList || 'unknown'}. Open services fingerprinted.` },
                    { id: 'T1592', name: 'Gather Host Info', description: 'OS, service versions, and banners collected from open ports.' },
                ],
                riskLevel: 'medium', timeEstimate: '1–7 days',
            },
            {
                phase: 'Initial Access', mitreId: 'TA0001',
                techniques: [
                    { id: 'T1190', name: 'Exploit Public-Facing App', description: `Misconfiguration "${miscSample}" enables direct exploitation without credentials.` },
                    { id: 'T1078', name: 'Valid Accounts', description: 'Default or weak credentials leveraged on exposed services.' },
                ],
                riskLevel: hasRisky ? 'critical' : 'high', timeEstimate: '< 1 day',
            },
            {
                phase: 'Execution', mitreId: 'TA0002',
                techniques: [
                    { id: 'T1059', name: 'Command & Scripting Interpreter', description: 'Shell commands executed via exposed service (SSH, Telnet, or RCE).' },
                    { id: 'T1569', name: 'System Services', description: 'Attacker uses service control to execute payloads persistently.' },
                ],
                riskLevel: 'critical', timeEstimate: 'Minutes',
            },
            {
                phase: 'Persistence', mitreId: 'TA0003',
                techniques: [
                    { id: 'T1053', name: 'Scheduled Task / Job', description: 'Cron job or Task Scheduler entry created for persistent access.' },
                    { id: 'T1136', name: 'Create Account', description: 'New local or domain user added to maintain backdoor access.' },
                ],
                riskLevel: 'high', timeEstimate: '< 1 hour',
            },
            {
                phase: 'Privilege Escalation', mitreId: 'TA0004',
                techniques: [
                    { id: 'T1068', name: 'Exploit for Privilege Escalation', description: 'Unpatched local service exploited for SYSTEM/root access.' },
                    { id: 'T1548', name: 'Abuse Elevation Control Mechanism', description: 'UAC bypass or sudo misconfiguration exploited.' },
                ],
                riskLevel: 'critical', timeEstimate: '< 2 hours',
            },
            {
                phase: 'Lateral Movement', mitreId: 'TA0008',
                techniques: [
                    { id: 'T1021', name: 'Remote Services', description: 'Pivots via RDP (3389), SSH (22), or SMB onto adjacent hosts.' },
                    { id: 'T1550', name: 'Use Alternate Authentication Material', description: 'Pass-the-hash or Kerberoasting used to move laterally.' },
                ],
                riskLevel: 'high', timeEstimate: '1–5 hours',
            },
            {
                phase: 'Exfiltration', mitreId: 'TA0010',
                techniques: [
                    { id: 'T1041', name: 'Exfiltration Over C2 Channel', description: 'Sensitive data exfiltrated over established C2 channel.' },
                    { id: 'T1567', name: 'Exfiltration to Cloud Storage', description: 'Data staged and uploaded to attacker-controlled cloud bucket.' },
                ],
                riskLevel: 'critical', timeEstimate: '2–24 hours',
            },
        ],

        iocList: [
            { type: 'IP', value: '185.220.101.47', label: 'C2 Server', severity: 'critical' },
            { type: 'Domain', value: 'cdn-update-service.net', label: 'Malware Drop Domain', severity: 'high' },
            { type: 'Hash', value: 'a3f5e9c2b1d4608f...f8a7', label: 'Implant SHA-256', severity: 'critical' },
            { type: 'Port', value: openPorts[0] || '4444', label: 'C2 Callback Port', severity: 'high' },
            { type: 'URL', value: 'https://cdn-update-service.net/pl.sh', label: 'Payload Download URL', severity: 'critical' },
        ],

        mitigations: [
            { id: 'M1030', title: 'Network Segmentation', priority: 'critical', description: `Restrict access to exposed ports (${portList}). Use firewall allowlists.` },
            { id: 'M1026', title: 'Privileged Account Management', priority: 'critical', description: 'Enforce least-privilege. Remove default credentials immediately.' },
            { id: 'M1051', title: 'Update Software', priority: 'high', description: 'Patch all internet-facing services. Enable automatic security updates.' },
            { id: 'M1031', title: 'Network Intrusion Prevention', priority: 'high', description: 'Deploy IPS/IDS to detect lateral movement and C2 beaconing.' },
            { id: 'M1049', title: 'Antivirus / Anti-Malware', priority: 'high', description: 'Real-time endpoint protection to catch payload execution.' },
        ],

        riskBreakdown: [
            { category: 'Initial Access', score: Math.min(50 + portCount * 4 + (hasRisky ? 20 : 0), 99) },
            { category: 'Execution', score: Math.min(55 + miscCount * 5, 99) },
            { category: 'Persistence', score: 72 },
            { category: 'Privilege Escalation', score: Math.min(60 + miscCount * 4, 99) },
            { category: 'Lateral Movement', score: 68 },
            { category: 'Exfiltration', score: Math.min(65 + portCount * 2, 95) },
        ],

        detectionDifficulty: miscCount >= 5 ? 'Hard' : miscCount >= 2 ? 'Moderate' : 'Low',
        estimatedDwellTime: hasRisky ? '30–90 days' : '7–30 days',

        affectedAssets: [
            ...(openPorts.includes('3389') || openPorts.includes('22') ? ['Remote Access (RDP/SSH)'] : []),
            ...(openPorts.includes('3306') || openPorts.includes('5432') || openPorts.includes('27017') ? ['Database Server'] : []),
            ...(openPorts.includes('25') || openPorts.includes('587') ? ['Mail Server'] : []),
            ...(openPorts.includes('80') || openPorts.includes('443') ? ['Web Server'] : []),
            'Active Directory',
        ].filter(Boolean).slice(0, 6),
    };
}

// ─── Unified Export ───────────────────────────────────────────────────────────
// Respects VITE_USE_MOCK env flag so no code change is needed to go live.

export function analyzeAttackChain(payload, signal) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
        return runAttackSimulationMock(payload, signal);
    }
    return runAttackSimulation(payload, signal);
}

export default apiClient;
