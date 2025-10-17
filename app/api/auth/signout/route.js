// Explicit signout endpoint (workaround for Next.js 15 + NextAuth v5 beta)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handlers } from "@/auth";

// Re-export both handlers
export const { GET, POST } = handlers;
