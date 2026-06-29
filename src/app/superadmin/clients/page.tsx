'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { IconBuildingStore, IconUser, IconCircleFilled, IconExternalLink } from '@tabler/icons-react';
import Toggle from '@/components/Toggle';
import Toast from '@/components/Toast';
import { useShop } from '@/context/ShopContext';

export default function ClientsPage() {
  const supabase = createClientComponentClient();
  const { setCurrentShop } = useShop();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shops')
      .select(`
        *,
        profiles (email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setToast({ message: 'Ошибка загрузки: ' + error.message, type: 'error' });
    } else {
      setShops(data || []);
    }
    setLoading(false);
  }

  async function toggleShopActive(shopId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('shops')
      .update({ is_active: !currentStatus })
      .eq('id', shopId);

    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setShops(shops.map(s => s.id === shopId ? { ...s, is_active: !currentStatus } : s));
      setToast({ message: 'Статус магазина обновлен', type: 'success' });
    }
  }

  if (loading) return <div className="p-10 text-zinc-400">Загрузка списка клиентов...</div>;

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Управление клиентами</h2>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-1/3">Название магазина</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Баланс примерок</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Домен</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Статус</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Активность</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-zinc-100">
            {shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-zinc-400">Магазины не найдены</td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
                        <IconBuildingStore size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{shop.name}</div>
                        <button 
                          onClick={async () => {
                            await setCurrentShop(shop);
                            window.location.href = '/admin/dashboard';
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mt-1"
                        >
                          Войти в магазин <IconExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-zinc-900">{shop.remaining_generations}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm text-zinc-600">{shop.domain || '—'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1.5">
                      <IconCircleFilled size={8} className={shop.is_active ? 'text-emerald-500' : 'text-zinc-300'} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {shop.is_active ? 'Активен' : 'Приостановлен'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-4">
                      <Toggle 
                        enabled={!!shop.is_active} 
                        onChange={() => toggleShopActive(shop.id, shop.is_active)} 
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
