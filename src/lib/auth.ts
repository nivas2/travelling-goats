import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
    // Google configured as OAuth2 (not OIDC) with explicit issuer.
    // oauth4webapi v3 validates the RFC 9207 "iss" parameter that Google
    // includes in its authorization callback. We must set the issuer to
    // match what Google sends, otherwise it defaults to "https://authjs.dev".
    {
      id: "google",
      name: "Google",
      type: "oauth",
      issuer: "https://accounts.google.com",
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          response_type: "code",
        },
      },
      token: { url: "https://oauth2.googleapis.com/token" },
      userinfo: { url: "https://openidconnect.googleapis.com/v1/userinfo" },
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
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

        // In dev mode, accept mock OTP. Hard-gated on NODE_ENV so a stray
        // OTP_MOCK_ENABLED=true in a production env can never bypass real OTP.
        if (
          process.env.NODE_ENV !== "production" &&
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
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatar,
            role: user.role,
            isOnboarded: user.isOnboarded,
            isVerified: user.isVerified,
            idVerified: user.idVerified,
          };
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

        if (!otpRecord) return null;
        // Lockout: too many wrong guesses on this code (brute-force guard).
        if (otpRecord.attempts >= 3) return null;

        if (otpRecord.code !== otp) {
          // Count the failed guess so the lockout above can actually trigger.
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          isOnboarded: user.isOnboarded,
          isVerified: user.isVerified,
          idVerified: user.idVerified,
        };
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          isOnboarded: user.isOnboarded,
          isVerified: user.isVerified,
          idVerified: user.idVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign-in, populate the JWT with custom user fields.
      // This callback runs in Node.js during sign-in (API route handler),
      // so Prisma calls are safe here. It also runs in Edge (middleware)
      // for token refresh, but we only query the DB when `user` is present.
      if (user) {
        token.id = user.id;

        if (account?.provider === "google") {
          // Google profile() only returns id/name/email/image.
          // Look up the DB user to get role, isOnboarded, etc.
          // The PrismaAdapter has already created/linked the user by this point.
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                role: true,
                isOnboarded: true,
                isVerified: true,
                idVerified: true,
                referralCode: true,
              },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.isOnboarded = dbUser.isOnboarded;
              token.isVerified = dbUser.isVerified;
              token.idVerified = dbUser.idVerified;
              // Ensure Google users get a referral code
              if (!dbUser.referralCode) {
                await prisma.user.update({
                  where: { id: user.id as string },
                  data: { referralCode: generateReferralCode() },
                });
              }
            } else {
              token.role = "USER";
              token.isOnboarded = false;
              token.isVerified = false;
              token.idVerified = false;
            }
          } catch {
            // Fallback if DB is unreachable
            token.role = "USER";
            token.isOnboarded = false;
            token.isVerified = false;
            token.idVerified = false;
          }
        } else {
          // Credentials providers (phone-otp, admin-login) return full user data
          // from authorize(), so we can read custom fields directly.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = user as any;
          token.role = u.role ?? "USER";
          token.isOnboarded = u.isOnboarded ?? false;
          token.isVerified = u.isVerified ?? false;
          token.idVerified = u.idVerified ?? false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Read everything from the JWT token — zero database calls.
      // Fully Edge-compatible.
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.role = token.role ?? "USER";
        u.isOnboarded = token.isOnboarded ?? false;
        u.isVerified = token.isVerified ?? false;
        u.idVerified = token.idVerified ?? false;
      }
      return session;
    },
  },
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MMR";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
