'use client';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import Input from '@/components/Input';
import { IconChevronDown } from '@tabler/icons-react';

export default function PromptsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const ANALYTIC_MODELS = {
    google: [
      { id: 'models/gemini-2.0-flash', label: 'gemini-2.0-flash [Free]' },
      { id: 'models/gemini-2.5-flash', label: 'gemini-2.5-flash [Free]' },
      { id: 'models/gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite [Free]' },
      { id: 'models/gemini-3.5-flash', label: 'gemini-3.5-flash [Free]' },
    ],
    kodik: [
      { id: 'openai/gpt-4o-mini', label: 'gpt-4o-mini' },
      { id: 'openai/gpt-4o', label: 'gpt-4o' },
    ]
  };

  const GENERATIVE_MODELS = {
    google: [
      { id: 'models/imagen-4.0-fast-generate-001', label: 'imagen-4.0-fast [Paid]' },
      { id: 'models/imagen-4.0-generate-001', label: 'imagen-4.0 [Paid]' },
      { id: 'models/gemini-3.1-flash-image', label: 'gemini-3.1-flash-image [Paid]' },
    ],
    kodik: [
      { id: 'openai/gpt-4o', label: 'gpt-4o' },
      { id: 'openai/gpt-4o-mini', label: 'gpt-4o-mini' },
      { id: 'kolors', label: 'kolors (Try-On)' },
    ],
    recraft: [
      { id: 'recraftv4_1', label: 'Recraft V4.1' },
      { id: 'recraftv4_1_pro', label: 'Recraft V4.1 Pro' },
    ]
  };

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
        [`provider_${type}`]: settings[`provider_${type}`],
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
          provider={settings.provider_generation}
          models={GENERATIVE_MODELS}
          onPromptChange={(val: string) => setSettings((prev: any) => ({ ...prev, prompt_generation: val }))}
          onModelChange={(val: string) => setSettings((prev: any) => ({ ...prev, model_generation: val }))}
          onProviderChange={(val: string) => setSettings((prev: any) => ({ ...prev, provider_generation: val }))}
          onSave={() => handleSave('generation')}
          isSaving={savingKey === 'generation'}
        />

        <PromptBlock 
          title="Модерация фото пользователя"
          prompt={settings.prompt_moderation}
          model={settings.model_moderation}
          provider={settings.provider_moderation}
          models={ANALYTIC_MODELS}
          onPromptChange={(val: string) => setSettings((prev: any) => ({ ...prev, prompt_moderation: val }))}
          onModelChange={(val: string) => setSettings((prev: any) => ({ ...prev, model_moderation: val }))}
          onProviderChange={(val: string) => setSettings((prev: any) => ({ ...prev, provider_moderation: val }))}
          onSave={() => handleSave('moderation')}
          isSaving={savingKey === 'moderation'}
        />

        <PromptBlock 
          title="Классификация товаров (Фид)"
          prompt={settings.prompt_classification}
          model={settings.model_classification}
          provider={settings.provider_classification}
          models={ANALYTIC_MODELS}
          onPromptChange={(val: string) => setSettings((prev: any) => ({ ...prev, prompt_classification: val }))}
          onModelChange={(val: string) => setSettings((prev: any) => ({ ...prev, model_classification: val }))}
          onProviderChange={(val: string) => setSettings((prev: any) => ({ ...prev, provider_classification: val }))}
          onSave={() => handleSave('classification')}
          isSaving={savingKey === 'classification'}
        />      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function PromptBlock({ title, prompt, model, provider, models, onPromptChange, onModelChange, onProviderChange, onSave, isSaving }: any) {
  const availableModels = models[provider] || [];
  const selectStyles = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all cursor-pointer appearance-none";

  return (
    <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">{title}</h3>
      
      <div className="space-y-6 mb-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Провайдер</label>
            <div className="relative">
            <select 
              className={selectStyles}
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value;
                // Обновляем провайдера
                onProviderChange(newProvider);
                
                // Находим первую модель для этого провайдера и обновляем её
                const firstModel = models[newProvider]?.[0]?.id;
                if (firstModel) {
                  onModelChange(firstModel);
                }
              }}
            >
              <option value="kodik">KodikRouter</option>
              <option value="google">Google Gemini</option>
              <option value="recraft">Recraft AI</option>
            </select>              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <IconChevronDown size={16} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Используемая модель</label>
            <div className="relative">
              <select 
                className={selectStyles}
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
              >
                {availableModels.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <IconChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>
        
        <Input 
          label="Текст промпта"
          multiline
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Введите текст промпта..."
        />
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