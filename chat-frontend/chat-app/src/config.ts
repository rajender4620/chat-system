// Single source of truth for the backend URL.
// Reads from the VITE_API_URL env var (.env locally, Vercel env vars in production).
// Falls back to localhost for safety if the var is missing.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
