'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function SuperAdminProfilePage() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setName(data.full_name || '');
    }
  }

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name
      })
      .eq('id', user.id);

    if (error) {
      setToast({ message: `Ошибка: ${error.message}`, type: 'error' });
    } else {
      setToast({ message: 'Имя успешно обновлено', type: 'success' });
    }
    setLoading(false);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      setToast({ message: 'Пароли не совпадают', type: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordData.password
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Пароль успешно обновлен', type: 'success' });
      setPasswordData({ password: '', confirmPassword: '' });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl font-bold tracking-tight mb-10">Профиль администратора</h2>

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">Данные аккаунта</h3>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <Input 
              label="Имя"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
            />
            <Input 
              label="Email"
              value={user?.email || ''}
              readOnly
              disabled
              icon={<IconLock size={16} />}
              className="bg-zinc-50 cursor-not-allowed"
            />
            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ИМЯ'}
              </Button>
            </div>
          </form>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b pb-4 mb-6">Смена пароля</h3>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input 
              label="Новый пароль"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.password}
              onChange={e => setPasswordData({...passwordData, password: e.target.value})}
              required
              icon={showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              onIconClick={() => setShowPassword(!showPassword)}
            />
            <Input 
              label="Подтверждение пароля"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
              icon={showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              onIconClick={() => setShowPassword(!showPassword)}
            />
            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'ОБНОВЛЕНИЕ...' : 'ОБНОВИТЬ ПАРОЛЬ'}
              </Button>
            </div>
          </form>
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
