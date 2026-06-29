'use client';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import Select from '@/components/Select';

export default function PromptsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const AVAILABLE_MODELS = [
    'google/gemini-1.5-pro',
    'google/gemini-1.5-flash',
    'google/gemini-2.0-flash-exp',
    'openai/gpt-4o-mini',
    'openai/gpt-4o'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(type: 'generation' | 'moderation' | 'classification') {
    setSavingKey(type);
    try {
      const payload = {
        [`prompt_${type}`]: settings[`prompt_${type}`],
        [`model_${type}`]: settings[`model_${type}`],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('platform_settings')
        .update(payload)
        .eq('id', 1);

      if (error) throw error;
      setToast({ message: 'Настройки успешно обновлены', type: 'success' });
    } catch (err: any) {
      setToast({ message: 'Ошибка: ' + err.message, type: 'error' });
    } finally {
      setSavingKey(null);
    }
  }

  if (loading || !settings) return <div className="p-10 text-zinc-400">Загрузка настроек...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-3xl font-bold tracking-tight mb-10">Глобальные настройки AI</h2>

      <div className="space-y-8">
        <PromptBlock 
          title="Генерация (Try-On)"
          prompt={settings.prompt_generation}
          model={settings.model_generation}
          models={AVAILABLE_MODELS}
          onPromptChange={(val: string) => setSettings({ ...settings, prompt_generation: val })}
          onModelChange={(val: string) => setSettings({ ...settings, model_generation: val })}
          onSave={() => handleSave('generation')}
          isSaving={savingKey === 'generation'}
        />

        <PromptBlock 
          title="Модерация фото пользователя"
          prompt={settings.prompt_moderation}
          model={settings.model_moderation}
          models={AVAILABLE_MODELS}
          onPromptChange={(val: string) => setSettings({ ...settings, prompt_moderation: val })}
          onModelChange={(val: string) => setSettings({ ...settings, model_moderation: val })}
          onSave={() => handleSave('moderation')}
          isSaving={savingKey === 'moderation'}
        />

        <PromptBlock 
          title="Классификация товаров (Фид)"
          prompt={settings.prompt_classification}
          model={settings.model_classification}
          models={AVAILABLE_MODELS}
          onPromptChange={(val: string) => setSettings({ ...settings, prompt_classification: val })}
          onModelChange={(val: string) => setSettings({ ...settings, model_classification: val })}
          onSave={() => handleSave('classification')}
          isSaving={savingKey === 'classification'}
        />
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function PromptBlock({ title, prompt, model, models, onPromptChange, onModelChange, onSave, isSaving }: any) {
  return (
    <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">{title}</h3>
      
      <div className="space-y-6 mb-4">
        <Select 
          label="Используемая модель"
          options={models}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
        />
        
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Текст промпта</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-sm h-48 focus:border-black outline-none transition-all leading-relaxed"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Введите текст промпта..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          size="M" 
          onClick={onSave} 
          disabled={isSaving}
          className="min-w-[140px]"
        >
          {isSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
        </Button>
      </div>
    </div>
  );
}