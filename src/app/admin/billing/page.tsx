'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { IconCreditCard, IconHistory, IconPlus, IconCheck, IconBolt } from '@tabler/icons-react';

declare global {
  interface Window {
    cp: any;
  }
}

export default function BillingPage() {
  const supabase = createClientComponentClient();
  const { currentShop, refreshShops } = useShop();
  const { isSuperAdmin, user } = useAuth();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    if (currentShop) {
      fetchBillingData();
    }
  }, [currentShop]);

  async function fetchBillingData() {
    setLoading(true);
    
    // Загружаем тарифы
    let query = supabase.from('tariffs').select('*');
    
    if (!isSuperAdmin) {
      // Обычный пользователь видит публичные тарифы ИЛИ свой текущий (даже если он приватный)
      query = query.or(`is_public.eq.true,id.eq.${currentShop.tariff_id}`);
    }
    
    const { data: tData } = await query.order('price', { ascending: true });

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

  // Функция оплаты через CloudPayments
  const handlePay = (tariff: any) => {
    if (!window.cp) {
      setToast({ message: 'Ошибка загрузки платежного модуля', type: 'error' });
      return;
    }

    const widget = new window.cp.CloudPayments();
    widget.pay('auth', {
      publicId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID || 'pk_test_placeholder',
      description: `Оплата тарифа: ${tariff.name}`,
      amount: tariff.price,
      currency: 'RUB',
      accountId: user?.email,
      data: {
        shop_id: currentShop.id,
        tariff_id: tariff.id,
        type: 'tariff'
      }
    }, {
      onSuccess: (options: any) => {
        setToast({ message: 'Платеж успешно проведен! Баланс обновится в течение минуты.', type: 'success' });
        setTimeout(() => {
          refreshShops();
          fetchBillingData();
        }, 3000);
      },
      onFail: (reason: any, options: any) => {
        setToast({ message: 'Ошибка оплаты: ' + reason, type: 'error' });
      }
    });
  };

  // Функция покупки пакета
  const handleBuyPackage = (amount: number, generations: number) => {
    if (!window.cp) return;

    const widget = new window.cp.CloudPayments();
    widget.pay('auth', {
      publicId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID || 'pk_test_placeholder',
      description: `Пополнение: +${generations} примерок`,
      amount: amount,
      currency: 'RUB',
      accountId: user?.email,
      data: {
        shop_id: currentShop.id,
        generations: generations,
        type: 'package'
      }
    }, {
      onSuccess: () => {
        setToast({ message: 'Баланс пополнен', type: 'success' });
        setTimeout(() => {
          refreshShops();
          fetchBillingData();
        }, 3000);
      }
    });
  };

  // Мгновенная активация для суперадмина (только смена тарифа без начисления баланса)
  async function handleActivate(tariff: any) {
    setActionLoading(tariff.id);
    
    const { error } = await supabase
      .from('shops')
      .update({ tariff_id: tariff.id })
      .eq('id', currentShop.id);

    if (!error) {
      setToast({ message: 'Тариф изменен', type: 'success' });
      await refreshShops();
      fetchBillingData();
    } else {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    }
    setActionLoading(null);
  }

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин</div>;
  if (loading) return <div className="p-10 text-zinc-400">Загрузка данных...</div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Биллинг и тарифы</h2>
        </div>
        {/* {isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <IconBolt size={16} className="text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Режим суперадмина</span>
          </div>
        )} */}
      </div>

      {/* Текущий баланс */}
      <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-black shadow-xl flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Доступно генераций</p>
          <div className="text-5xl font-black flex items-center gap-4">
            {currentShop.remaining_generations}
            <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest ${
              currentShop.is_active 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {currentShop.is_active ? 'Активен' : 'Заблокирован'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Текущий тариф</p>
          <div className="text-xl font-bold">{tariffs.find(t => t.id === currentShop.tariff_id)?.name || 'Не выбран'}</div>
        </div>
      </div>

      {/* Выбор тарифа */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Тарифные планы</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tariffs.map((tariff) => (
            <div key={tariff.id} className={`bg-white p-8 rounded-2xl border transition-all flex flex-col ${currentShop.tariff_id === tariff.id ? 'border-black ring-1 ring-black' : 'border-zinc-200 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-bold">{tariff.name}</h4>
                {currentShop.tariff_id === tariff.id && (
                  <span className="text-[8px] bg-black text-white px-2 py-1 rounded font-bold uppercase tracking-widest">Текущий</span>
                )}
                {!tariff.is_public && (
                  <span className="text-[8px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Приватный</span>
                )}
              </div>
              <div className="text-3xl font-black mb-6">{new Intl.NumberFormat('ru-RU').format(tariff.price)} ₽</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-zinc-600">
                  <IconCheck size={16} className="text-emerald-500" /> {tariff.generations_limit} генераций
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-600">
                  <IconCheck size={16} className="text-emerald-500" /> Поддержка 24/7
                </li>
              </ul>
              
              <div className="space-y-2">
                <Button 
                  variant={currentShop.tariff_id === tariff.id ? 'secondary' : 'primary'} 
                  className="w-full" 
                  onClick={() => handlePay(tariff)}
                  disabled={currentShop.tariff_id === tariff.id}
                >
                  {currentShop.tariff_id === tariff.id ? 'ТЕКУЩИЙ ТАРИФ' : 'ВЫБРАТЬ'}
                </Button>
                
                {isSuperAdmin && (
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => handleActivate(tariff)}
                    disabled={actionLoading === tariff.id}
                  >
                    {actionLoading === tariff.id ? 'АКТИВАЦИЯ...' : 'АКТИВИРОВАТЬ'}
                  </Button>
                )}
              </div>
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
