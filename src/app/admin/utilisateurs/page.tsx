'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AdminUsersModal from '@/components/AdminUsersModal';

export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <AdminUsersModal
        isOpen={true}
        onClose={() => router.push('/admin')}
        initialTab="users"
      />
    </div>
  );
}

