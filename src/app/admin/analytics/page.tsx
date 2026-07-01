'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useShop } from '@/context/ShopContext';
import { IconArrowUpRight, IconArrowDownRight, IconChartBar } from '@tabler/icons-react';
import Tabs from '@/components/Tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function AnalyticsPage() {
  const supabase = createClientComponentClient();
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (currentShop) fetchAnalytics();
  }, [currentShop, dateRange]);

  async function fetchAnalytics() {
    setLoading(true);
    
    const now = new Date();
    let startDate = new Date();
    if (dateRange === 'today') startDate.setHours(0,0,0,0);
    else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);

    const { data: generations } = await supabase
      .from('generations')
      .select('created_at, status')
      .eq('shop_id', currentShop.id)
      .gte('created_at', startDate.toISOString());

    const { data: events } = await supabase
      .from('analytics_events')
      .select('created_at, event_type')
      .eq('shop_id', currentShop.id)
      .gte('created_at', startDate.toISOString());

    if (generations && events) {
      const totalGens = generations.length;
      const completed = generations.filter(g => g.status === 'completed').length;
      
      const views = events.filter(e => e.event_type === 'widget_view').length;
      const opens = events.filter(e => e.event_type === 'widget_open').length;

      // Группировка для графика (по генерациям)
      const groups: any = {};
      generations.forEach(g => {
        const date = new Date(g.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
        groups[date] = (groups[date] || 0) + 1;
      });

      const chart = Object.entries(groups).map(([name, value]) => ({ name, value }));
      setChartData(chart);

      setStats({
        views,
        opens,
        generations: totalGens,
        successRate: totalGens > 0 ? Math.round((completed / totalGens) * 100) : 0
      });
    }

    setLoading(false);
  }

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Аналитика</h2>
        </div>

        <Tabs 
          tabs={[
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' }
          ]}
          activeTab={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Показы виджета" value={stats?.views || 0} />
        <StatCard label="Открытия" value={stats?.opens || 0} />
        <StatCard label="Генерации" value={stats?.generations || 0} />
        <StatCard label="Успешность" value={`${stats?.successRate || 0}%`} />
      </div>

      {/* График */}
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8">Динамика примерок</h3>
        <div className="h-80 w-full relative">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#a1a1aa'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#a1a1aa'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <IconChartBar size={24} className="text-zinc-300" />
              </div>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Нет данных для графика</p>
              <p className="text-[10px] text-zinc-400 mt-1">События появятся здесь после первых примерок</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change }: { label: string, value: any, change?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <div className="flex items-end justify-between mt-3">
        <h3 className="text-2xl font-black">{value}</h3>
        {change && (
          <span className="text-green-600 text-[10px] font-bold flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
            {change} <IconArrowUpRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
