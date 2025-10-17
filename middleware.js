/**
 * Security Headers Middleware for SOC2 & ISO 27001 Compliance
 * Implements security headers only - audit logging now handled by PostHog
 */

import { NextResponse } from 'next/server';

// Security headers for SOC2 CC6.2 compliance
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy - Updated to include PostHog
  'Content-Security-Policy': process.env.NODE_ENV === 'production' 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.posthog.com https://us.i.posthog.com https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://a.klaviyo.com https://*.posthog.com https://us.i.posthog.com https://*.sentry.io wss://localhost:* ws://localhost:*"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://us.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://a.klaviyo.com https://*.posthog.com https://us.i.posthog.com wss://localhost:* ws://localhost:*",
  
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Prevent embedding in iframes
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export async function middleware(request) {
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Basic rate limiting headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-Client-IP', ip);
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and NextAuth API routes
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};