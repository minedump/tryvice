'use client';

import React from 'react';
import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative flex flex-col items-center">
        <div className="animate-pulse mb-8">
          <Logo className="h-8 w-auto text-black" />
        </div>
        
        <div className="w-48 h-[2px] bg-zinc-100 overflow-hidden relative rounded-full">
          <div className="absolute inset-0 bg-black w-1/3 animate-loading-bar" />
        </div>
        
        <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
          Загрузка
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
