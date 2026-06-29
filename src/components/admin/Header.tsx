'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { IconChevronDown, IconBuildingStore, IconLayoutDashboard } from '@tabler/icons-react';
import Logo from '@/components/Logo';

export default function Header() {
  const router = useRouter();
  const { shops, currentShop, setCurrentShop } = useShop();
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
        <div className="relative group">
          <button className="flex items-center gap-3 px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-900 transition-all bg-zinc-50/50">
            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white">
              <IconBuildingStore size={14} />
            </div>
            <span className="text-sm font-bold">{currentShop?.name || 'Выберите магазин'}</span>
            <IconChevronDown size={16} className="text-zinc-400" />
          </button>

          {/* Выпадающий список */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setCurrentShop(null);
                    window.location.href = '/superadmin/clients';
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left mb-1 ${
                    !currentShop ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600">
                    <IconLayoutDashboard size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Панель управления</div>
                    <div className="text-[10px] text-zinc-400 truncate">Вернуться к списку клиентов</div>
                  </div>
                </button>
              )}
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  disabled={!shop.is_active && !isSuperAdmin}
                  onClick={() => {
                    setCurrentShop(shop);
                    window.location.href = '/admin/dashboard';
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    currentShop?.id === shop.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  } ${!shop.is_active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600">
                    <IconBuildingStore size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold flex items-center justify-between">
                      {shop.name}
                      {!shop.is_active && (
                        <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded">BLOCKED</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">{shop.domain}</div>
                  </div>
                </button>
              ))}
            </div>
            {!isSuperAdmin && (
              <div className="border-t border-zinc-100 p-2 bg-zinc-50/50">
                <a href="/admin/settings?action=new" className="block w-full text-center py-2 text-xs font-bold text-zinc-500 hover:text-black transition-colors">
                  + Добавить магазин
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
