'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { IconChevronDown, IconPlus, IconBuildingStore, IconCheck } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ShopSelector() {
  const { shops, currentShop, setCurrentShop } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
        className="w-full flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 hover:border-black transition-all group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 bg-black text-white rounded-lg shrink-0">
            {currentShop ? <IconBuildingStore size={16} /> : <IconPlus size={16} />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider truncate">
            {currentShop ? currentShop.name : '+ Добавить'}
          </span>
        </div>
        {shops.length > 0 && (
          <IconChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto py-2">
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => {
                  setCurrentShop(shop);
                  setIsOpen(false);
                  if (searchParams.get('action') === 'new') {
                    router.push('/admin/dashboard');
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
              >
                <span className={`text-sm ${currentShop?.id === shop.id ? 'font-bold text-black' : 'text-zinc-600'}`}>
                  {shop.name}
                </span>
                {currentShop?.id === shop.id && <IconCheck size={16} className="text-black" />}
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-100 p-2 bg-zinc-50">
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
        </div>
      )}
    </div>
  );
}
