'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { IconChevronDown, IconBuildingStore, IconLayoutDashboard } from '@tabler/icons-react';
import Logo from '@/components/Logo';

import ShopSelector from '@/components/ShopSelector';

export default function Header() {
  const { isSuperAdmin } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Логотип */}
      <div className="flex items-center gap-2">
        <Logo className="h-4 w-auto text-black" />
        {isSuperAdmin && (
          <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold ml-1">ADMIN</span>
        )}
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-4">
        <ShopSelector />
      </div>
    </header>
  );
}
