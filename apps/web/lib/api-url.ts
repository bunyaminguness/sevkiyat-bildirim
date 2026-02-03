/**
 * Get the API base URL for making requests to the backend.
 * 
 * In production with Cloudflare Tunnel, the frontend and backend share the same origin,
 * so we can use window.location.origin.
 * 
 * In development, we use NEXT_PUBLIC_API_URL from environment variables.
 */
export function getApiUrl(): string {
  // Check if NEXT_PUBLIC_API_URL is defined
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In production (or when env var is not set), use same origin
  // This works because Cloudflare Tunnel routes both frontend and API through same domain
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for server-side rendering (shouldn't normally reach here in Next.js App Router)
  return '';
}
