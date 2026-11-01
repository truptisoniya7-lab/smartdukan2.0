/**
 * Minimal JWT decoder — reads payload without verifying signature.
 * Verification happens server-side on every request.
 */
export function jwtDecode(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    if (!payload) throw new Error('Invalid JWT');
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + (4 - (padded.length % 4)) % 4, '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}
