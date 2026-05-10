import { z } from 'zod';

// ─── Sanitization Helpers ─────────────────────────────────────────────────────

/** Strip all HTML tags from a string */
export function stripHtml(str) {
    return str.replace(/<[^>]*>/g, '').trim();
}

/** Strip <script> blocks and JS event attributes from a string */
export function stripScripts(str) {
    return str
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}

// ─── Port Validation ──────────────────────────────────────────────────────────

/** Returns true if a value is a valid port number (integer 1–65535) */
export function isValidPort(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 65535;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

export const attackSimulationSchema = z.object({

    // Open Ports: array of integer strings, 1–65535, max 50 entries
    openPorts: z
        .array(
            z
                .string()
                .regex(/^\d+$/, 'Ports must be numeric.')
                .refine((v) => isValidPort(v), 'Port must be between 1 and 65535.')
        )
        .min(1, 'Add at least one open port.')
        .max(50, 'Maximum 50 ports allowed.'),

    // Misconfigurations: array of sanitized strings, max 20 entries
    misconfigurations: z
        .array(
            z
                .string()
                .min(1, 'Misconfiguration entry cannot be empty.')
                .max(200, 'Each entry must be under 200 characters.')
                .transform(stripHtml)
        )
        .max(20, 'Maximum 20 misconfiguration entries allowed.')
        .default([]),

    // Log Snippet: textarea — strip scripts, max 5000 chars
    logSnippet: z
        .string()
        .max(5000, 'Log snippet must be under 5000 characters.')
        .transform(stripScripts)
        .optional()
        .or(z.literal('')),
});

// ─── Default Form Values ──────────────────────────────────────────────────────

export const defaultFormValues = {
    openPorts: [],   // string[]
    misconfigurations: [],  // string[]
    logSnippet: '',   // string
};

// ─── Preset port lists for quick-add ─────────────────────────────────────────

export const PORT_PRESETS = [
    {
        label: 'Web Server',
        ports: ['80', '443', '8080', '8443'],
        description: 'HTTP/HTTPS + alternates',
    },
    {
        label: 'Remote Access',
        ports: ['22', '23', '3389', '5900'],
        description: 'SSH, Telnet, RDP, VNC',
    },
    {
        label: 'Database',
        ports: ['1433', '3306', '5432', '27017', '6379'],
        description: 'MSSQL, MySQL, Postgres, Mongo, Redis',
    },
    {
        label: 'Mail',
        ports: ['25', '110', '143', '465', '587', '993', '995'],
        description: 'SMTP, POP3, IMAP',
    },
];

// ─── Common misconfiguration suggestions ─────────────────────────────────────

export const MISCONFIGURATION_SUGGESTIONS = [
    'Default credentials not changed',
    'Telnet enabled',
    'FTP anonymous access',
    'SMBv1 enabled',
    'Unpatched OS',
    'Open CORS policy',
    'Public S3 bucket',
    'Unauthenticated Redis',
    'Debug mode enabled',
    'Weak TLS (SSLv3/TLS 1.0)',
    'Directory listing enabled',
    'Admin panel exposed to internet',
    'No rate limiting',
    'Wildcard DNS record',
    'NFS mount exposed',
];
