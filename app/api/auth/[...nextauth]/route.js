/**
 * Auth.js v5 API Route Handler
 *
 * This file has been updated for Auth.js v5 (next-auth@beta)
 * - Handlers are now imported from the root auth.ts config file
 * - No more need to create handler or pass authOptions
 * - Cleaner and simpler implementation
 *
 * See /auth.ts for the main configuration
 */

import { handlers } from "@/auth";

// Export route segment config - MUST be before handler creation for Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Export the handlers directly from auth.ts
export const { GET, POST } = handlers;