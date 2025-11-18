// Estructura base para NextAuth con Google y Google Calendar
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Aquí puedes guardar el token de Google para usarlo con la API de Calendar
      return true;
    },
    async session({ session, token, user }) {
      // Puedes adjuntar el token de Google a la sesión
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };