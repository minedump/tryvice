'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { IconRefresh, IconExternalLink, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useShop } from '@/context/ShopContext';
import Button from '@/components/Button';
import Toggle from '@/components/Toggle';

const ITEMS_PER_PAGE = 50;

export default function ProductsPage() {
  const supabase = createClientComponentClient();
  const { currentShop } = useShop();
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (currentShop) fetchProducts();
  }, [currentShop, currentPage]);

  async function fetchProducts() {
    if (!currentShop) return;
    setLoading(true);

    // Получаем общее количество
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', currentShop.id);
    
    setTotalCount(count || 0);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (count),
        generations (count)
      `)
      .eq('shop_id', currentShop.id)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (error) console.error('Fetch products error:', error);

    if (data) setProducts(data);
    setLoading(false);
  }

  async function toggleVisibility(productId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('products')
      .update({ is_visible: !currentStatus })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, is_visible: !currentStatus } : p));
    }
  }

  async function handleSync() {
    if (!currentShop) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shop_id: currentShop.id, 
          xml_feed_url: currentShop.xml_feed_url 
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      await fetchProducts();
    } catch (err: any) {
      alert(`Ошибка синхронизации: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  if (!currentShop) return <div className="p-10 text-zinc-400">Выберите магазин</div>;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold tracking-tight">Товары</h2>
            {currentShop.xml_feed_url && (
              <a 
                href={currentShop.xml_feed_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Открыть XML фид"
              >
                <IconExternalLink size={20} />
                <span className="text-sm font-medium">XML Feed</span>
              </a>
            )}
          </div>
          <p className="text-zinc-500 text-sm">
            Показано {startItem}-{endItem} из {totalCount} товаров
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <IconRefresh size={18} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Синхронизация...' : 'Обновить список'}
        </Button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Название</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Цена</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Категория</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Доступность</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Фото</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">URL</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Примерок</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Активность</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && products.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-10 text-center text-zinc-400">Загрузка данных...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-10 text-center text-zinc-400">Товары не найдены</td></tr>
            ) : products.map((product: any) => (
              <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-5">
                  <div className="text-sm text-zinc-600">
                    {product.name}
                  </div>
                </td>
                <td className="px-4 py-5 text-sm font-medium whitespace-nowrap">
                  {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
                </td>
                <td className="px-4 py-5 text-sm text-zinc-600">{product.category || '—'}</td>
                <td className="px-4 py-5">
                  {product.available !== false ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                      В наличии
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-400 border border-zinc-100">
                      Нет в наличии
                    </span>
                  )}
                </td>
                <td className="px-4 py-5 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.product_images[0]?.count > 0 ? 'bg-zinc-100 text-zinc-800' : 'bg-red-50 text-red-700'}`}>
                    {product.product_images[0]?.count || 0}
                  </span>
                </td>
                <td className="px-4 py-5 text-center">
                  <a href={product.url} target="_blank" className="text-zinc-400 hover:text-black transition-colors">
                    <IconExternalLink size={18} />
                  </a>
                </td>
                <td className="px-4 py-5 text-center">
                  <span className="text-sm font-medium text-zinc-900">
                    {product.generations[0]?.count || 0}
                  </span>
                </td>
                <td className="px-4 py-5 text-right">
                  <div className="flex justify-end">
                    <Toggle 
                      enabled={!!product.is_visible} 
                      onChange={() => toggleVisibility(product.id, product.is_visible)} 
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-200 flex items-center justify-between">
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

