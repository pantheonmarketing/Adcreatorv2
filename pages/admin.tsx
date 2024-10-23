'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import UserProfile from '../components/UserProfile';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email !== 'yoniwe@gmail.com') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <div className="text-2xl text-gray-800 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.email !== 'yoniwe@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <div className="text-2xl text-red-600 dark:text-red-400">Access denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
      <ThemeToggle />
      <UserProfile />
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-8">
          Admin Dashboard
        </h1>
        <AdminDashboard />
      </div>
    </div>
  );
}
