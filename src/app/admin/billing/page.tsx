'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useShop } from '@/context/ShopContext';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { IconCreditCard, IconHistory, IconPlus, IconCheck } from '@tabler/icons-react';

export default function BillingPage() {
  const supabase = createClientComponentClient();
  const { currentShop, refreshShops } = useShop();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    if (currentShop) {
      fetchBillingData();
    }
  }, [currentShop]);

  async function fetchBillingData() {
    setLoading(true);
    
    // Загружаем публичные тарифы
    const { data: tData } = await supabase
      .from('tariffs')
      .select('*')
      .eq('is_public', true)
      .order('price', { ascending: true });

    // Загружаем историю транзакций
    const { data: trData } = await supabase
      .from('transactions')
      .select('*')
      .eq('shop_id', currentShop.id)
      .order('created_at', { ascending: false });

    setTariffs(tData || []);
    setTransactions(trData || []);
    setLoading(false);
  }

  async function handleBuyPackage(amount: number, generations: number) {
    // В реальности здесь вызов CloudPayments
    // Сейчас просто имитируем успешную покупку
    const { error } = await supabase.rpc('add_generations', {
      p_shop_id: currentShop.id,
      p_amount: generations,
      p_payment_amount: amount,
      p_description: `Пакет +${generations} примерок`
    });

    if (error) {
      setToast({ message: 'Ошибка оплаты: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Баланс пополнен', type: 'success' });
      await refreshShops();
      fetchBillingData();
    }
  }

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин</div>;
  if (loading) return <div className="p-10 text-zinc-400">Загрузка данных...</div>;

  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-bold tracking-tight">Биллинг и тарифы</h2>

      {/* Текущий баланс */}
      <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-black shadow-xl flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Доступно генераций</p>
          <div className="text-5xl font-black">{currentShop.remaining_generations}</div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Статус магазина</p>
          <div className="flex items-center gap-2 justify-end">
            <div className={`w-2 h-2 rounded-full ${currentShop.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="font-bold uppercase tracking-widest text-xs">{currentShop.is_active ? 'Активен' : 'Заблокирован'}</span>
          </div>
        </div>
      </div>

      {/* Выбор тарифа */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Тарифные планы</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tariffs.map((tariff) => (
            <div key={tariff.id} className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
              <h4 className="text-xl font-bold mb-2">{tariff.name}</h4>
              <div className="text-3xl font-black mb-6">{new Intl.NumberFormat('ru-RU').format(tariff.price)} ₽</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-zinc-600">
                  <IconCheck size={16} className="text-emerald-500" /> {tariff.generations_limit} генераций
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-600">
                  <IconCheck size={16} className="text-emerald-500" /> Поддержка 24/7
                </li>
              </ul>
              <Button variant="secondary" className="w-full">ВЫБРАТЬ</Button>
            </div>
          ))}
        </div>
      </section>

      {/* Дополнительные пакеты */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Докупить примерки</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[ 
            { gens: 100, price: 990 },
            { gens: 500, price: 3900 },
            { gens: 1000, price: 6900 }
          ].map((pkg) => (
            <button 
              key={pkg.gens}
              onClick={() => handleBuyPackage(pkg.price, pkg.gens)}
              className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-black transition-all text-left group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-colors">
                  <IconPlus size={20} />
                </div>
                <div className="text-xl font-black">{pkg.price} ₽</div>
              </div>
              <div className="font-bold text-zinc-900">+{pkg.gens} примерок</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">Разовое пополнение</p>
            </button>
          ))}
        </div>
      </section>

      {/* История транзакций */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">История операций</h3>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Описание</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Дата</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-zinc-400">Операций пока не было</td></tr>
              ) : (
                transactions.map((tr) => (
                  <tr key={tr.id}>
                    <td className="px-8 py-4">
                      <div className="text-sm font-bold text-zinc-900">{tr.description}</div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">{tr.type === 'tariff' ? 'Тариф' : 'Пакет'}</div>
                    </td>
                    <td className="px-8 py-4 text-sm text-zinc-500">
                      {new Date(tr.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-zinc-900">
                      {new Intl.NumberFormat('ru-RU').format(tr.amount)} ₽
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
