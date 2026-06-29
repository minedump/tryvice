'use client';
import React, { Suspense } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Footer from '@/components/admin/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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


