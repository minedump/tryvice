// src/app/superadmin/tariffs/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Toast from '@/components/Toast';
import { IconCreditCard, IconTrash, IconPlus, IconEdit, IconX } from '@tabler/icons-react';
import Toggle from '@/components/Toggle';

export default function TariffsPage() {
  const supabase = createClientComponentClient();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<any>(null);
  
  // Состояние для редактирования
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    generations_limit: '',
    is_public: true
  });

  useEffect(() => {
    fetchTariffs();
  }, []);

  async function fetchTariffs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tariffs')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      setToast({ message: 'Ошибка загрузки: ' + error.message, type: 'error' });
    } else {
      setTariffs(data || []);
    }
    setLoading(false);
  }

  // Начало редактирования: заполняем форму данными тарифа
  function startEdit(tariff: any) {
    setEditingId(tariff.id);
    setFormData({
      name: tariff.name,
      price: tariff.price.toString(),
      generations_limit: tariff.generations_limit.toString(),
      is_public: tariff.is_public
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Отмена редактирования
  function cancelEdit() {
    setEditingId(null);
    setFormData({ name: '', price: '', generations_limit: '', is_public: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      generations_limit: parseInt(formData.generations_limit),
      is_public: formData.is_public
    };

    let error;
    if (editingId) {
      // Обновление
      const { error: updateError } = await supabase
        .from('tariffs')
        .update(payload)
        .eq('id', editingId);
      error = updateError;
    } else {
      // Создание
      const { error: insertError } = await supabase
        .from('tariffs')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setToast({ message: editingId ? 'Тариф обновлен' : 'Тариф создан', type: 'success' });
      cancelEdit();
      fetchTariffs();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('tariffs').delete().eq('id', id);
    if (error) {
      setToast({ message: 'Ошибка удаления', type: 'error' });
    } else {
      setTariffs(tariffs.filter(t => t.id !== id));
      setToast({ message: 'Тариф удален', type: 'success' });
      if (editingId === id) cancelEdit();
    }
  }

  if (loading) return <div className="p-10 text-zinc-400">Загрузка тарифов...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Конструктор тарифов</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма создания/редактирования */}
        <div className="lg:col-span-1">
          <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {editingId ? 'Редактирование' : 'Новый тариф'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Название"
                placeholder="Напр. Старт"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input 
                label="Стоимость (₽)"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                required
              />
              <Input 
                label="Лимит генераций"
                type="number"
                placeholder="100"
                value={formData.generations_limit}
                onChange={e => setFormData({...formData, generations_limit: e.target.value})}
                required
              />
              <div className="flex items-center justify-between py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Публичный тариф</span>
                <Toggle 
                  enabled={formData.is_public} 
                  onChange={(val) => setFormData({...formData, is_public: val})} 
                />
              </div>
              <div className="pt-2 space-y-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'СОХРАНЕНИЕ...' : (editingId ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОЗДАТЬ ТАРИФ')}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" className="w-full" onClick={cancelEdit}>
                    ОТМЕНА
                  </Button>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Список тарифов */}
        <div className="lg:col-span-2 space-y-4">
          {tariffs.length === 0 ? (
            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-12 text-center text-zinc-400">
              Тарифы еще не созданы
            </div>
          ) : (
            tariffs.map((tariff) => (
              <div key={tariff.id} className={`bg-white p-6 rounded-2xl border transition-all flex items-center justify-between ${editingId === tariff.id ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                    <IconCreditCard size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900">{tariff.name}</h4>
                      {!tariff.is_public && (
                        <span className="text-[8px] bg-zinc-100 text-zinc-500 px-1 py-0.5 rounded font-bold">PRIVATE</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {tariff.generations_limit} генераций • {new Intl.NumberFormat('ru-RU').format(tariff.price)} ₽
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEdit(tariff)}
                    className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors"
                    title="Редактировать"
                  >
                    <IconEdit size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(tariff.id)}
                    className="p-2 text-zinc-300 hover:text-red-600 transition-colors"
                    title="Удалить тариф"
                  >
                    <IconTrash size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}