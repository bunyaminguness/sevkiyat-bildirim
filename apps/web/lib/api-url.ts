/**
 * Get the API base URL for making requests to the backend.
 * 
 * In production with Cloudflare Tunnel, the frontend and backend share the same origin,
 * so we can use window.location.origin.
 * 
 * In development, we use NEXT_PUBLIC_API_URL from environment variables.
 */
export function getApiUrl(): string {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL tanımlı değil");
  }
  return process.env.NEXT_PUBLIC_API_URL;
}
