import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/welcome",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const phone = credentials.phone as string;
        const otp = credentials.otp as string;

        // In dev mode, accept mock OTP
        if (
          process.env.OTP_MOCK_ENABLED === "true" &&
          otp === (process.env.OTP_MOCK_CODE ?? "123456")
        ) {
          let user = await prisma.user.findUnique({ where: { phone } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                phone,
                referralCode: generateReferralCode(),
              },
            });
          }
          return { id: user.id, name: user.name, email: user.email, image: user.avatar };
        }

        // Verify OTP from database
        const otpRecord = await prisma.otpCode.findFirst({
          where: {
            phone,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!otpRecord || otpRecord.code !== otp) return null;
        if (otpRecord.attempts >= 3) return null;

        // Mark OTP as verified
        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { verified: true },
        });

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              referralCode: generateReferralCode(),
            },
          });
        }

        return { id: user.id, name: user.name, email: user.email, image: user.avatar };
      },
    }),
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.role !== "ADMIN") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.avatar };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in (runs in Node.js, not Edge), fetch user data from DB
      // and store in token so middleware/session don't need Prisma
      if (user) {
        token.id = user.id;
      }
      // Refresh role from DB when missing or on explicit update
      // Uses try/catch so it gracefully fails in Edge Runtime
      if (token.id && (!token.role || trigger === "update")) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              isOnboarded: true,
              isVerified: true,
              idVerified: true,
            },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isOnboarded = dbUser.isOnboarded;
            token.isVerified = dbUser.isVerified;
            token.idVerified = dbUser.idVerified;
          }
        } catch {
          // Edge Runtime — Prisma not available, keep existing token data
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Read everything from the JWT token — no Prisma needed
      // This is Edge-compatible since it doesn't hit the database
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.role = token.role;
        u.isOnboarded = token.isOnboarded;
        u.isVerified = token.isVerified;
        u.idVerified = token.idVerified;
      }
      return session;
    },
  },
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "PA";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
