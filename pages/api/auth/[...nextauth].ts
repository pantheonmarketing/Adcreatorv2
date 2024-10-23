import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sql } from '@vercel/postgres';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Always allow yoniwe@gmail.com to sign in
      if (user.email === 'yoniwe@gmail.com') {
        return true;
      }

      // Check if user is in authorized_users table
      try {
        const result = await sql`
          SELECT * FROM authorized_users WHERE email = ${user.email}
        `;
        return result.rows.length > 0;
      } catch (error) {
        console.error('Database error:', error);
        return false;
      }
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
};

export default NextAuth(authOptions);
