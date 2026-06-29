'use client';
import React, { Suspense } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Footer from '@/components/admin/Footer';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="text-zinc-400 animate-pulse font-bold uppercase tracking-widest text-xs">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-72 bg-white border-r border-zinc-200" />}>
          <Sidebar />
        </Suspense>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="max-w-6xl mx-auto p-12">
              {children}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}


