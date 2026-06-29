'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useShop } from '@/context/ShopContext';
import { IconExternalLink, IconShare, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Button from '@/components/Button';

const ITEMS_PER_PAGE = 50;

export default function HistoryPage() {
  const supabase = createClientComponentClient();
  const { currentShop } = useShop();
  const [generations, setGenerations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentShop) fetchHistory();
  }, [currentShop, currentPage]);

  async function fetchHistory() {
    setLoading(true);

    // Получаем общее количество для пагинации
    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', currentShop.id);
    
    setTotalCount(count || 0);

    const { data } = await supabase
      .from('generations')
      .select(`
        *,
        products (name, url)
      `)
      .eq('shop_id', currentShop.id)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (data) setGenerations(data);
    setLoading(false);
  }

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин</div>;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Просмотр примерок</h2>
        {totalCount > 0 && (
          <p className="text-zinc-500 text-sm">
            Показано {startItem}-{endItem} из {totalCount} примерок
          </p>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Результат</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Товар</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Клиент</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Статус</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Дата</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {generations.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-12 text-center text-zinc-400">Примерок пока не было</td></tr>
            ) : generations.map((gen: any) => (
              <tr key={gen.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-8 py-5">
                  {gen.result_image_url ? (
                    <img src={gen.result_image_url} className="w-16 h-20 object-cover rounded-lg shadow-sm border border-zinc-100" />
                  ) : (
                    <div className="w-16 h-20 bg-zinc-100 rounded-lg flex items-center justify-center text-[10px] text-zinc-400 text-center px-2">
                      {gen.status === 'processing' ? 'В процессе' : 'Нет фото'}
                    </div>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-bold text-zinc-900">{gen.products?.name || 'Удаленный товар'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <a href={gen.products?.url} target="_blank" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-1">
                      Товар <IconExternalLink size={12} />
                    </a>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <img src={gen.user_image_url} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-50 shadow-sm" />
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    gen.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                    gen.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {gen.status === 'completed' ? 'Готово' : 
                     gen.status === 'failed' ? 'Ошибка' : 'В работе'}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-zinc-500">
                  {new Date(gen.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-zinc-400 hover:text-black transition-colors">
                    <IconShare size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-zinc-50/50 border-t border-zinc-200 flex items-center justify-between">
            <div className="text-sm text-zinc-500">
              Страница {currentPage} из {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="S"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <IconChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="S"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <IconChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
