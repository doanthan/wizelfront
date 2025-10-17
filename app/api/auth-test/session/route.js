// Test NextAuth session endpoint without catch-all route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();

    return Response.json({
      session: session || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
