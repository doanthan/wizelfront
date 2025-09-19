import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export route segment config
export const dynamic = 'force-dynamic';

// Export named exports for each HTTP method
export { handler as GET, handler as POST };