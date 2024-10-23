'use client';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div>
        <p>Logged in as: {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn('google')}>
      Sign in with Google
    </button>
  );
}
