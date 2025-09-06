import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import User from '@/models/User';
import Contract from '@/models/Contract';
import connectToDatabase from '@/lib/mongoose';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('Auth attempt for:', credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          // Ensure mongoose connection
          await connectToDatabase();

          // Find user by email (select password for comparison)
          const user = await User.findOne({ email: credentials.email }).select('+password');
          console.log('User found:', !!user);
          if (!user) {
            console.log('User not found for email:', credentials.email);
            return null;
          }

          // Validate password
          console.log('Password from user:', user.password ? 'exists' : 'missing');
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log('Password valid:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          // Update last login
          user.last_login = new Date();
          await user.save();

          // Get user's contracts
          const contracts = user.primary_contract_id ? 
            await Contract.findByUserSeats(user._id.toString()) : [];

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            is_super_admin: user.is_super_user || user.super_user_role === 'SUPER_ADMIN',
            primary_contract_id: user.primary_contract_id?.toString(),
            contracts: contracts || [],
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.primary_contract_id = user.primary_contract_id;
        token.contracts = user.contracts;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.primary_contract_id = token.primary_contract_id;
        session.user.contracts = token.contracts;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 365 * 24 * 60 * 60, // 365 days for development
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60, // 365 days for development
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };