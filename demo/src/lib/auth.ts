import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';

async function captureLead(name: string, email: string, provider: string) {
    const apiUrl = process.env.CMS_API_URL;
    if (!apiUrl) return;
    try {
        await fetch(`${apiUrl}/public/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name || 'Demo Visitor',
                email,
                message: `Signed up for Mero CMS demo playground via ${provider}`,
                originPage: 'demo-playground',
                metadata: {
                    provider,
                    signupAt: new Date().toISOString(),
                    source: 'demo-playground',
                },
            }),
        });
    } catch {
        // Never block sign-in if lead capture fails
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
            authorization: {
                params: { scope: 'openid profile email' },
            },
            issuer: 'https://www.linkedin.com',
            jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            // Capture as a CMS lead on first sign-in
            if (user.email) {
                await captureLead(
                    user.name ?? '',
                    user.email,
                    account?.provider ?? 'unknown',
                );
            }
            return true;
        },

        async jwt({ token, account }) {
            if (account) {
                token.provider = account.provider;
                token.leadCaptured = true;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.provider = token.provider as string;
            }
            return session;
        },
    },

    pages: {
        signIn: '/',
        error: '/',
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
};
