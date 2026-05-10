import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Auth Store ───────────────────────────────────────────────────────────────
// Manages authentication state and API key for the analysis service.
// Persisted to localStorage so sessions survive page refresh.

const useAuthStore = create(
    persist(
        (set, get) => ({
            // ── State ────────────────────────────────────────────────────────────
            apiKey: null,         // Stored API key (e.g., OpenAI, custom backend JWT)
            isAuthenticated: false,
            user: null,           // { name, email, role, avatarUrl }
            sessionToken: null,   // Short-lived session token from backend

            // ── Actions ──────────────────────────────────────────────────────────
            /**
             * Set the API key for analysis requests.
             * @param {string} key
             */
            setApiKey: (key) =>
                set({
                    apiKey: key,
                    isAuthenticated: Boolean(key),
                }),

            /**
             * Set the user profile returned after login.
             * @param {{ name: string, email: string, role: string, avatarUrl?: string }} userData
             */
            setUser: (userData) =>
                set({
                    user: userData,
                    isAuthenticated: true,
                }),

            /**
             * Store a short-lived session token (e.g., JWT from backend).
             * @param {string} token
             */
            setSessionToken: (token) => set({ sessionToken: token }),

            /**
             * Returns the active auth header value for API calls.
             * Prefers sessionToken over raw apiKey.
             */
            getAuthHeader: () => {
                const { sessionToken, apiKey } = get();
                if (sessionToken) return `Bearer ${sessionToken}`;
                if (apiKey) return `Bearer ${apiKey}`;
                return null;
            },

            /**
             * Clear all auth state (logout / session expiry).
             */
            logout: () =>
                set({
                    apiKey: null,
                    isAuthenticated: false,
                    user: null,
                    sessionToken: null,
                }),

            /**
             * Alias for logout — called automatically by the API layer
             * when a 401 Unauthorized response is received.
             */
            clearSession: () =>
                set({
                    sessionToken: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'cyber-edt-auth', // localStorage key
            // Only persist non-sensitive UI-relevant fields
            partialize: (state) => ({
                apiKey: state.apiKey,
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                sessionToken: state.sessionToken,
            }),
        }
    )
);

// Named export for the API service layer (non-hook usage via getState())
export { useAuthStore };
export default useAuthStore;
