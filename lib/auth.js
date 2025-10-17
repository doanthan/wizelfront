/**
 * Auth.js v5 Compatibility Layer
 *
 * IMPORTANT: This file has been updated for Auth.js v5 (next-auth@beta)
 *
 * Migration changes:
 * - authOptions moved to /auth.ts (root level)
 * - getServerSession replaced with auth() function
 * - This file now re-exports the auth() function for backward compatibility
 *
 * Usage in API routes:
 *
 * OLD (v4):
 * import { getServerSession } from "next-auth/next";
 * import { authOptions } from "@/lib/auth";
 * const session = await getServerSession(authOptions);
 *
 * NEW (v5):
 * import { auth } from "@/lib/auth";
 * const session = await auth();
 *
 * The new auth() function works everywhere:
 * - Server Components
 * - API Routes
 * - Middleware
 * - No need to pass authOptions anymore!
 */

import { auth as nextAuthAuth, signIn, signOut } from "@/auth";

/**
 * Universal auth() function that works across all server contexts
 *
 * This replaces getServerSession from v4 and provides a cleaner API.
 * Returns the session object or null if not authenticated.
 *
 * @example
 * // In API routes
 * import { auth } from "@/lib/auth";
 *
 * export async function GET(request) {
 *   const session = await auth();
 *   if (!session?.user?.email) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *   // Use session.user
 * }
 *
 * @example
 * // In Server Components
 * import { auth } from "@/lib/auth";
 *
 * export default async function Page() {
 *   const session = await auth();
 *   return <div>Welcome {session?.user?.name}</div>
 * }
 */
export const auth = nextAuthAuth;

/**
 * Server-side sign in function
 * Use this for programmatic sign-ins on the server
 */
export { signIn };

/**
 * Server-side sign out function
 * Use this for programmatic sign-outs on the server
 */
export { signOut };

/**
 * DEPRECATED: authOptions is no longer needed in v5
 *
 * For backward compatibility, we export an empty object.
 * If you see this being used in your code, please migrate to the new auth() function.
 *
 * @deprecated Use auth() instead
 */
export const authOptions = {};

/**
 * DEPRECATED: getServerSession replacement
 *
 * For migration convenience, this function forwards to auth()
 * Please update your code to use auth() directly.
 *
 * @deprecated Use auth() directly instead
 */
export async function getServerSession() {
  console.warn(
    "⚠️ getServerSession is deprecated in Auth.js v5. Please use auth() instead."
  );
  return await auth();
}