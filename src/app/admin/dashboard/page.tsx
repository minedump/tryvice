'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useShop } from '@/context/ShopContext';
import Input from '@/components/Input';

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    totalGenerations: 0,
    uniqueUsers: 0,
    popularProducts: [] as any[]
  });

  useEffect(() => {
    if (currentShop) {
      fetchStats();
    }
  }, [currentShop, dateRange]);

  async function fetchStats() {
    setLoading(true);
    
    const now = new Date();
    let startDate = new Date();
    if (dateRange === 'today') startDate.setHours(0,0,0,0);
    else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);

    // 1. Всего примерок
    const { count: total } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', currentShop.id)
      .gte('created_at', startDate.toISOString());

    // 2. Уникальные пользователи
    const { data: visitors } = await supabase
      .from('generations')
      .select('visitor_id')
      .eq('shop_id', currentShop.id)
      .gte('created_at', startDate.toISOString());
    
    const uniqueVisitors = new Set(visitors?.map(v => v.visitor_id)).size;

    // 3. Популярные товары
    const { data: popular } = await supabase
      .from('generations')
      .select(`
        product_id,
        products (id, name, category, price)
      `)
      .eq('shop_id', currentShop.id)
      .gte('created_at', startDate.toISOString())
      .not('product_id', 'is', null);

    const productCounts = popular?.reduce((acc: any, item: any) => {
      const id = item.product_id;
      if (!item.products) return acc;
      if (!acc[id]) {
        acc[id] = { ...item.products, count: 0 };
      }
      acc[id].count += 1;
      return acc;
    }, {});

    const sortedProducts = Object.values(productCounts || {})
      .sort((a: any, b: any) => b.count - a.count);

    setStats({
      totalGenerations: total || 0,
      uniqueUsers: uniqueVisitors,
      popularProducts: sortedProducts
    });
    
    setLoading(false);
  }

  const filteredProducts = stats.popularProducts.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин для просмотра статистики</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Дашборд</h2>
        </div>

        <div className="flex bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
          {[ 
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                dateRange === range.id ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Всего примерок</div>
          <div className="text-4xl font-black">{stats.totalGenerations}</div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Пользователей</div>
          <div className="text-4xl font-black">{stats.uniqueUsers}</div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Конверсий в примерку</div>
          <div className="text-4xl font-black">
            {stats.uniqueUsers > 0 ? ((stats.totalGenerations / stats.uniqueUsers).toFixed(1)) : 0}
          </div>
        </div>
      </div>

      {/* Популярные товары */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-8 py-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Популярные товары</h3>
          <div className="w-64">
            <Input 
              placeholder="Поиск по товарам..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!mb-0"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Название</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Категория</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 text-right">Примерок</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-zinc-400">Загрузка данных...</td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="text-sm font-bold text-zinc-900">{product.name}</div>
                      <div className="text-[10px] text-zinc-400">ID: {product.id.split('-')[0]}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                        {product.category || 'Без категории'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="text-sm font-black text-zinc-900">{product.count}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-zinc-400">Нет данных по примеркам</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}