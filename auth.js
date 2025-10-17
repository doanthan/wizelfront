/**
 * Auth.js v5 Configuration
 *
 * IMPORTANT: This is the centralized authentication configuration for the entire application.
 * - All authentication logic is defined here
 * - API routes import the handlers from this file
 * - Use auth() function throughout the app instead of getServerSession
 *
 * Migration from v4 to v5:
 * - Configuration moved from API route to root-level file
 * - getServerSession replaced with auth()
 * - Handlers exported separately for API routes
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";
import Contract from "@/models/Contract";
import ContractSeat from "@/models/ContractSeat";
import connectToDatabase from "@/lib/mongoose";
import bcrypt from "bcryptjs";

// Auth.js v5 configuration
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("Auth attempt for:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          // Ensure mongoose connection
          await connectToDatabase();

          // Find user by email (select password for comparison)
          const user = await User.findOne({ email: credentials.email }).select("+password");
          console.log("User found:", !!user);
          if (!user) {
            console.log("User not found for email:", credentials.email);
            return null;
          }

          // Validate password
          console.log("Password from user:", user.password ? "exists" : "missing");
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log("Password valid:", isValidPassword);

          if (!isValidPassword) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          // Update last login
          user.last_login = new Date();
          await user.save();

          // Get user's contracts (convert to plain objects)
          const contractDocs = user.primary_contract_id
            ? await Contract.findByUserSeats(user._id.toString())
            : [];

          // Convert Mongoose documents to plain objects for JWT serialization
          const contracts = contractDocs.map(contract => ({
            id: contract._id?.toString(),
            public_id: contract.public_id,
            name: contract.contract_name || contract.name,
          }));

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            is_super_admin: user.is_super_user || user.super_user_role === "SUPER_ADMIN",
            primary_contract_id: user.primary_contract_id?.toString(),
            contracts: contracts,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          await connectToDatabase();

          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create a new user for Google OAuth
            // Create user's primary contract first
            const contract = await Contract.create({
              name: `${user.name}'s Contract`,
              billing_email: user.email,
              owner_id: null, // Will be set after user creation
              stripe_customer_id: "oauth_" + Date.now(), // Placeholder
              contract_type: "individual",
              max_stores: 10,
              max_users: 1,
              ai_credits_balance: 10, // Welcome bonus
            });

            // Create user with a random password (they'll use Google to login)
            const randomPassword = Math.random().toString(36).slice(-12) + "A1!"; // Meets requirements
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            existingUser = await User.create({
              name: user.name,
              email: user.email,
              password: hashedPassword,
              primary_contract_id: contract._id,
              oauth_provider: "google",
              oauth_id: account.providerAccountId,
              last_login: new Date(),
            });

            // Update contract with owner_id
            await Contract.findByIdAndUpdate(contract._id, {
              owner_id: existingUser._id,
            });
          } else {
            // Update last login for existing user
            existingUser.last_login = new Date();
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.primary_contract_id = user.primary_contract_id;
        token.contracts = user.contracts;
      }

      // For Google OAuth, fetch user data
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.primary_contract_id = dbUser.primary_contract_id?.toString();

            // Get user's contracts (convert to plain objects)
            const contractDocs = dbUser.primary_contract_id
              ? await Contract.findByUserSeats(dbUser._id.toString())
              : [];

            // Convert Mongoose documents to plain objects for JWT serialization
            const contracts = contractDocs.map(contract => ({
              id: contract._id?.toString(),
              public_id: contract.public_id,
              name: contract.contract_name || contract.name,
            }));

            token.contracts = contracts;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.primary_contract_id = token.primary_contract_id;
        session.user.contracts = token.contracts;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 365 days for development
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60, // 365 days for development
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Critical for Next.js 15 and Vercel deployment
  trustHost: true,
  basePath: "/api/auth",
};

// Initialize NextAuth with the configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
