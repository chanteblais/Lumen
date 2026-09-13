import type { NextConfig } from "next";

// /lists redirected to /library from 2026-09-13 until Lists came back as its own sheet the same day.

/**
 * Security headers on every response (docs/pre-prod.md → Security headers).
 * Framing: none, not even same-origin (X-Frame-Options for old browsers,
 * frame-ancestors for current ones). Only frame-ancestors is set as CSP: a full
 * policy needs care for Clerk, the voice model's downloads and wasm.
 * Permissions: the microphone for voice input on this origin; no camera or location.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
