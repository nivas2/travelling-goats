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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = session.user as any;
          u.role = dbUser.role;
          u.isOnboarded = dbUser.isOnboarded;
          u.isVerified = dbUser.isVerified;
          u.idVerified = dbUser.idVerified;
        }
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
