'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { IconChevronDown, IconPlus, IconBuildingStore, IconCheck, IconLayoutDashboard } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ShopSelector() {
  const { shops, currentShop, setCurrentShop } = useShop();
  const { isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(search.toLowerCase()) ||
    shop.id.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-900 transition-all bg-zinc-50/50"
      >
        <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
          <IconBuildingStore size={14} />
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {currentShop && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${currentShop.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          )}
          <span className="text-sm font-bold truncate">
            {currentShop ? currentShop.name : 'Выберите магазин'}
          </span>
        </div>
        <IconChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setCurrentShop(null);
                  setIsOpen(false);
                  router.push('/superadmin/clients');
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

            {shops.length > 5 && (
              <div className="px-2 py-1 mb-1">
                <input 
                  type="text" 
                  placeholder="Поиск магазина..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-100 rounded-lg outline-none focus:border-black transition-all"
                  autoFocus
                />
              </div>
            )}

            {filteredShops.length === 0 ? (
              <div className="px-4 py-6 text-xs text-zinc-400 text-center">Ничего не найдено</div>
            ) : (
              filteredShops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => {
                    setCurrentShop(shop);
                    setIsOpen(false);
                    router.push('/admin/dashboard');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    currentShop?.id === shop.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600 shrink-0">
                    <IconBuildingStore size={16} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${shop.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="truncate">{shop.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">{shop.domain || 'Без домена'}</div>
                  </div>
                  {currentShop?.id === shop.id && <IconCheck size={16} className="text-black shrink-0" />}
                </button>
              ))
            )}
          </div>

          {!isSuperAdmin && (
            <div className="border-t border-zinc-100 p-2 bg-zinc-50/50">
              <button 
                onClick={() => {
                  setCurrentShop(null);
                  setIsOpen(false);
                  router.push('/admin/settings?action=new');
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
              >
                <IconPlus size={14} /> Добавить магазин
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}