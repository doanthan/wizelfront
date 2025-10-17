// Explicit session endpoint (workaround for Next.js 15 + NextAuth v5 beta)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handlers } from "@/auth";

// Re-export the GET handler from NextAuth
export const { GET } = handlers;
