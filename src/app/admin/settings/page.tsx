'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/Toast';
import Button from '@/components/Button';
import { IconTrash, IconCopy, IconCode } from '@tabler/icons-react';
import { useShop } from '@/context/ShopContext';
import Tooltip from '@/components/Tooltip';
import Input from '@/components/Input';

function SettingsForm() {
  const supabase = createClientComponentClient();
  const { currentShop, setCurrentShop, refreshShops } = useShop();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);
  const [savingWidget, setSavingWidget] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const initialFormData = {
    name: '',
    domain: '',
    xml_feed_url: '',
    url_mask: '/product/',
    primary_color: '#000000',
    button_text: 'Примерить онлайн',
    button_selector: '',
    consent_html: 'Нажимая на кнопку «Загрузить фото», вы соглашаетесь с <a href="/page/privacy">Политикой конфиденциальности</a> и даете <a href="/page/agreement">Согласие на обработку данных</a>'
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreating(true);
      setFormData(initialFormData);
      setCurrentShop(null);
      setLoading(false);
    } else if (currentShop) {
      setIsCreating(false);
      setFormData({
        name: currentShop.name,
        domain: currentShop.domain || '',
        xml_feed_url: currentShop.xml_feed_url || '',
        url_mask: currentShop.widget_settings?.url_mask || '/product/',
        primary_color: currentShop.widget_settings?.primary_color || '#000000',
        button_text: currentShop.widget_settings?.button_text || 'Примерить онлайн',
        button_selector: currentShop.widget_settings?.button_selector || '',
        consent_html: currentShop.widget_settings?.consent_html || initialFormData.consent_html
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [currentShop, searchParams]);

  const widgetCode = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" 
  data-shop-id="${currentShop?.id || ''}"${formData.button_selector ? `
  data-button-selector="${formData.button_selector}"` : ''}
  async defer
></script>`;

  async function handleSaveShop() {
    const { data: { user } } = await supabase.auth.getUser();
    setSavingShop(true);

    if (!formData.name.trim()) {
      setToast({ message: 'Укажите название магазина', type: 'error' });
      setSavingShop(false);
      return;
    }

    if (!formData.domain.trim()) {
      setToast({ message: 'Укажите домен магазина для работы виджета', type: 'error' });
      setSavingShop(false);
      return;
    }

    // Нормализация домена (добавление https:// если нет протокола)
    let normalizedDomain = formData.domain.trim();
    if (normalizedDomain && !normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
      normalizedDomain = `https://${normalizedDomain}`;
    }

    // Валидация фида перед сохранением
    if (formData.xml_feed_url) {
      setToast({ message: 'Проверка фида...', type: 'info' });
      try {
        const valRes = await fetch('/api/admin/shops/validate-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formData.xml_feed_url })
        });
        const valData = await valRes.json();
        if (!valData.valid) {
          setToast({ message: `Ошибка фида: ${valData.error}`, type: 'error' });
          setSavingShop(false);
          return;
        }
      } catch (err) {
        setToast({ message: 'Не удалось проверить фид', type: 'error' });
        setSavingShop(false);
        return;
      }
    }

    const payload: any = {
      owner_id: user?.id,
      name: formData.name,
      domain: normalizedDomain,
      xml_feed_url: formData.xml_feed_url.trim() || null
    };

    let result;
    if (!isCreating && currentShop?.id) {
      result = await supabase
        .from('shops')
        .update(payload)
        .eq('id', currentShop.id)
        .select()
        .single();
    } else {
      // При создании добавляем дефолтные настройки виджета
      result = await supabase
        .from('shops')
        .insert([{
          ...payload,
          widget_settings: {
            url_mask: formData.url_mask,
            primary_color: formData.primary_color,
            button_text: formData.button_text,
            button_selector: formData.button_selector,
            consent_html: formData.consent_html
          }
        }])
        .select()
        .single();
    }

    if (result.error) {
      setToast({ message: `Ошибка: ${result.error.message}`, type: 'error' });
    } else {
      const savedShop = result.data;
      setToast({ message: 'Данные магазина сохранены', type: 'success' });
      
      // Обновляем локальное состояние домена после нормализации
      setFormData(prev => ({ ...prev, domain: normalizedDomain }));
      
      if (payload.xml_feed_url) {
        fetch('/api/admin/products/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: savedShop.id })
        }).catch(err => console.error('Initial sync failed:', err));
      }

      await refreshShops();
      if (isCreating) window.location.href = '/admin/settings';
    }
    setSavingShop(false);
  }

  async function handleSaveWidget() {
    if (!currentShop?.id) return;
    setSavingWidget(true);

    const { error } = await supabase
      .from('shops')
      .update({
        widget_settings: {
          url_mask: formData.url_mask,
          primary_color: formData.primary_color,
          button_text: formData.button_text,
          button_selector: formData.button_selector,
          consent_html: formData.consent_html
        }
      })
      .eq('id', currentShop.id);

    if (error) {
      setToast({ message: `Ошибка: ${error.message}`, type: 'error' });
    } else {
      setToast({ message: 'Настройки виджета сохранены', type: 'success' });
      await refreshShops();
    }
    setSavingWidget(false);
  }

  async function handleDelete() {
    if (!currentShop?.id || !confirm('Вы уверены?')) return;
    const { error } = await supabase.from('shops').delete().eq('id', currentShop.id);
    if (error) {
      setToast({ message: 'Ошибка удаления', type: 'error' });
    } else {
      setToast({ message: 'Магазин удален', type: 'success' });
      window.location.reload();
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setToast({ message: 'Код скопирован в буфер обмена', type: 'success' });
  };

  if (loading) return <div className="p-10 text-zinc-400">Загрузка данных...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          {isCreating || !currentShop ? 'Создание магазина' : 'Настройки'}
        </h2>
      </div>
      
      <div className="space-y-8">
        {/* БЛОК 1: МАГАЗИН */}
        <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">Данные магазина</h3>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <Input 
              label="Название"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Например Мой магазин" 
            />
            <Input 
              label="Домен"
              value={formData.domain} 
              onChange={e => setFormData({...formData, domain: e.target.value})} 
              placeholder="myshop.ru" 
            />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Input 
              label="Товарный фид (XML)"
              type="url"
              value={formData.xml_feed_url} 
              onChange={e => setFormData({...formData, xml_feed_url: e.target.value})} 
              placeholder="https://..." 
            />
            <div className="relative">
              <div className="flex items-center gap-1 mb-1">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Маска URL</label>
                <Tooltip content="Виджет будет инициализироваться только на страницах, URL которых содержит эту строку (например, /product/)" />
              </div>
              <Input 
                value={formData.url_mask} 
                onChange={e => setFormData({...formData, url_mask: e.target.value})} 
                placeholder="/product/" 
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              {!isCreating && currentShop?.id && (
                <Button 
                  variant="secondary" 
                  color="red" 
                  size="M"
                  onClick={handleDelete}
                >
                  <IconTrash size={16} /> Удалить магазин
                </Button>
              )}
            </div>
            <Button size="M" onClick={handleSaveShop} disabled={savingShop}>
              {savingShop ? 'СОХРАНЕНИЕ...' : (isCreating || !currentShop ? 'СОЗДАТЬ МАГАЗИН' : 'СОХРАНИТЬ')}
            </Button>
          </div>
        </section>

        {/* БЛОК 2: ВИДЖЕТ (только если магазин создан) */}
        {!isCreating && currentShop && (
          <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">Настройка виджета</h3>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 tracking-widest">Цвет кнопки</label>
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-12 border border-zinc-200 rounded-lg p-1 cursor-pointer" 
                    value={formData.primary_color} onChange={e => setFormData({...formData, primary_color: e.target.value})} />
                  <Input 
                    value={formData.primary_color} 
                    readOnly 
                    className="flex-1"
                  />
                </div>
              </div>
              <Input 
                label="Текст кнопки"
                value={formData.button_text} 
                onChange={e => setFormData({...formData, button_text: e.target.value})} 
              />
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">CSS Селектор кнопки</label>
                <Tooltip content="Укажите класс или ID существующей кнопки на вашем сайте (напр. .buy-btn или #try-on). Если оставить пустым, виджет создаст свою кнопку." />
              </div>
              <Input 
                value={formData.button_selector} 
                onChange={e => setFormData({...formData, button_selector: e.target.value})} 
                placeholder=".custom-button-class" 
              />
            </div>
            <div className="mb-6">
              <Input 
                label="Согласие (HTML)"
                multiline
                value={formData.consent_html} 
                onChange={e => setFormData({...formData, consent_html: e.target.value})} 
              />
            </div>

            <div className="flex justify-end">
              <Button size="M" onClick={handleSaveWidget} disabled={savingWidget}>
                {savingWidget ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
              </Button>
            </div>

          </section>
        )}

        {/* БЛОК 3: ИНТЕГРАЦИЯ (только если магазин создан) */}
        {!isCreating && currentShop && (
          <section className="bg-zinc-900 p-8 rounded-2xl border border-black shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg"><IconCode size={20} /></div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Код для вставки</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Скопируйте этот код и вставьте его в секцию HEAD вашего сайта. Скрипт загружается асинхронно и не влияет на скорость работы магазина.
            </p>
            <div className="relative group">
              <pre className="bg-black/50 border border-white/10 rounded-xl p-6 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                {widgetCode}
              </pre>
              <Button 
                size="S" 
                onClick={copyCode}
                className="absolute top-4 right-4 bg-white text-black hover:bg-zinc-200"
              >
                <IconCopy size={14} /> Копировать
              </Button>
            </div>
          </section>
        )}

        <div className="flex justify-between items-center pt-4">
          <div>
          </div>
          <div className="flex gap-3">
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-zinc-400">Загрузка данных...</div>}>
      <SettingsForm />
    </Suspense>
  );
}