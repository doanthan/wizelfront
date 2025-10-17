import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export route segment config - force Node.js runtime for NextAuth compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Export named exports for each HTTP method
export { handler as GET, handler as POST };