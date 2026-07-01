'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { IconRefresh, IconExternalLink, IconChevronLeft, IconChevronRight, IconPhoto, IconShirt, IconX } from '@tabler/icons-react';
import { useShop } from '@/context/ShopContext';
import Button from '@/components/Button';
import Toggle from '@/components/Toggle';
import Tabs from '@/components/Tabs';
import Select from '@/components/Select';

const ITEMS_PER_PAGE = 50;
const IMAGES_PER_PAGE = 100;

export default function ProductsPage() {
  const supabase = createClientComponentClient();
  const { currentShop } = useShop();
  const [activeTab, setActiveTab] = useState<'products' | 'images'>('products');
  
  // Состояние для товаров
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Состояние для изображений
  const [images, setImages] = useState<any[]>([]);
  const [totalImagesCount, setTotalImagesCount] = useState(0);
  const [currentImagesPage, setCurrentImagesPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (currentShop) {
      if (activeTab === 'products') fetchProducts();
      else fetchImages();
    }
  }, [currentShop, currentPage, currentImagesPage, activeTab]);

  async function fetchProducts() {
    if (!currentShop) return;
    setLoading(true);

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

  async function fetchImages() {
    if (!currentShop) return;
    setLoading(true);

    // Сначала получаем ID всех товаров магазина
    const { data: shopProducts } = await supabase
      .from('products')
      .select('id')
      .eq('shop_id', currentShop.id);

    const productIds = shopProducts?.map(p => p.id) || [];

    if (productIds.length === 0) {
      setImages([]);
      setTotalImagesCount(0);
      setLoading(false);
      return;
    }

    const { count } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds);

    setTotalImagesCount(count || 0);

    const { data, error } = await supabase
      .from('product_images')
      .select(`
        *,
        products (name, url)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false })
      .range((currentImagesPage - 1) * IMAGES_PER_PAGE, currentImagesPage * IMAGES_PER_PAGE - 1);

    if (error) console.error('Fetch images error:', error);
    if (data) setImages(data);
    setLoading(false);
  }

  async function updateImageType(imageId: string, newType: string) {
    const { error } = await supabase
      .from('product_images')
      .update({ type: newType })
      .eq('id', imageId);

    if (!error) {
      setImages(images.map(img => img.id === imageId ? { ...img, type: newType } : img));
    }
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
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Товары</h2>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">{totalCount} товаров</span>
            <span className="text-zinc-200">/</span>
            {currentShop.xml_feed_url && (
              <a 
                href={currentShop.xml_feed_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
                title="Открыть XML фид"
              >
                <IconExternalLink size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">XML</span>
              </a>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs 
            tabs={[
              { id: 'products', label: 'Список товаров' },
              { id: 'images', label: 'Изображения' }
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'products' | 'images')}
          />
          <Button onClick={handleSync} disabled={syncing}>
            <IconRefresh size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Синхронизация...' : 'Обновить'}
          </Button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Название</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Цена</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Категория</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Доступность</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Фото</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Активность</th>
              </tr>
            </thead>              <tbody className="divide-y divide-zinc-100">
                {loading && products.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-zinc-400">Загрузка данных...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-zinc-400">Товары не найдены</td></tr>
                ) : products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">{product.name}</span>
                        <a href={product.url} target="_blank" className="text-zinc-300 hover:text-black transition-colors shrink-0">
                          <IconExternalLink size={14} />
                        </a>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">ID: {product.external_id}</div>
                    </td>
                    <td className="px-4 py-5 text-sm font-medium whitespace-nowrap">
                      {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
                    </td>
                    <td className="px-4 py-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-700 border border-zinc-100">
                        {product.category || '—'}
                      </span>
                    </td>
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
                    <td className="px-4 py-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${product.product_images[0]?.count > 0 ? 'border-zinc-100 bg-zinc-50 text-zinc-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                        {product.product_images[0]?.count || 0}
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
          </div>

          {/* Пагинация товаров */}
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
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-24">Фото</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Товар</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-64">Тип изображения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading && images.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-zinc-400">Загрузка изображений...</td></tr>
                ) : images.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-zinc-400">Изображения не найдены</td></tr>
                ) : images.map((img: any) => (
                  <tr key={img.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-100 cursor-zoom-in group relative flex items-center justify-center"
                        onClick={() => setSelectedImage(img.url)}
                      >
                        <img src={img.url} alt="" className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">{img.products?.name}</span>
                        {img.products?.url && (
                          <a href={img.products.url} target="_blank" className="text-zinc-300 hover:text-black transition-colors shrink-0">
                            <IconExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Select 
                        value={img.type}
                        onChange={(e) => updateImageType(img.id, e.target.value)}
                        options={['not_processed', 'product', 'outfit', 'not_clothing']}
                        className="!py-1.5 !text-[10px] font-bold uppercase tracking-widest"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация изображений */}
          {Math.ceil(totalImagesCount / IMAGES_PER_PAGE) > 1 && (
            <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-200 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                Страница {currentImagesPage} из {Math.ceil(totalImagesCount / IMAGES_PER_PAGE)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="S"
                  disabled={currentImagesPage === 1}
                  onClick={() => setCurrentImagesPage(prev => prev - 1)}
                >
                  <IconChevronLeft size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="S"
                  disabled={currentImagesPage === Math.ceil(totalImagesCount / IMAGES_PER_PAGE)}
                  onClick={() => setCurrentImagesPage(prev => prev + 1)}
                >
                  <IconChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модалка для просмотра фото */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <IconX size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

