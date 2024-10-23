import { useRouter } from 'next/router';
import Image from 'next/image';
import React from 'react';

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-800/95" />
      </div>

      <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-gray-400 mb-6">
            {error === 'AccessDenied' 
              ? 'You are not authorized to access this application. Please contact the administrator.'
              : 'An error occurred during authentication. Please try again.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
