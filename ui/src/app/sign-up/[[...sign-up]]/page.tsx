'use client';

import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';

function SignUpSkeleton() {
  return (
    <div className="w-full max-w-md p-8">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-2/3 mx-auto" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
        </div>
        <div className="h-10 bg-purple-500/30 rounded" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Suspense fallback={<SignUpSkeleton />}>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-gray-800 border border-gray-700',
            },
          }}
        />
      </Suspense>
    </div>
  );
}
