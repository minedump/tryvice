'use client';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

export default function PromptsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [prompts, setPrompts] = useState({
    generation_base: '',
    analysis_moderation: '',
    analysis_classification: ''
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'prompts')
      .single();

    if (data?.value) {
      setPrompts(data.value);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ 
        key: 'prompts', 
        value: prompts, 
        updated_at: new Date().toISOString() 
      });

    if (error) {
      setToast({ message: 'Ошибка сохранения: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Промпты успешно обновлены', type: 'success' });
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-zinc-400">Загрузка промптов...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-3xl font-bold tracking-tight mb-10">Глобальные промпты AI</h2>

      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl">
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Генерация (Try-On)</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-sm h-32 focus:border-black outline-none transition-all"
            value={prompts.generation_base}
            onChange={(e) => setPrompts({...prompts, generation_base: e.target.value})}
            placeholder="Введите базовый промпт для генерации..."
          />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-400">Модель: google/gemini-3.1-flash-image-preview</p>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-2xl">
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Модерация фото пользователя</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-sm h-32 focus:border-black outline-none transition-all"
            value={prompts.analysis_moderation}
            onChange={(e) => setPrompts({...prompts, analysis_moderation: e.target.value})}
          />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-400">Модель: google/gemini-2.0-flash-exp</p>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-2xl">
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Классификация товаров (Фид)</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-sm h-32 focus:border-black outline-none transition-all"
            value={prompts.analysis_classification}
            onChange={(e) => setPrompts({...prompts, analysis_classification: e.target.value})}
          />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-400">Модель: google/gemini-2.0-flash-exp</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="L" className="px-10">
            {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ВСЕ ПРОМПТЫ'}
          </Button>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
