import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="relative">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
              {session.user?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {session.user?.name}
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
