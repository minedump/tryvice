'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import Button from '@/components/Button';
import Input from '@/components/Input';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (searchParams.get('error') === 'expired') {
      setToast({
        message: 'Ссылка подтверждения просрочена. Пожалуйста, зарегистрируйтесь заново.',
        type: 'error'
      });
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      if (authError.message.includes('rate limit')) {
        setError('Слишком много попыток. Пожалуйста, подождите некоторое время или попробуйте позже.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: authData.user.id, 
          email: email, 
          full_name: fullName, 
          role: 'client' 
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      setToast({
        message: 'Регистрация успешна! Проверьте почту для подтверждения.',
        type: 'success'
      });
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 3000);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter">TRYVICE</h1>
        <p className="text-zinc-500 mt-2 text-sm">Создайте аккаунт клиента</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="bg-zinc-50 text-black border border-zinc-200 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        <Input
          label="Ваше имя"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Пароль"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          disabled={loading}
          size="L"
          className="w-full"
        >
          {loading ? 'СОЗДАНИЕ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-zinc-500">
        Уже есть аккаунт? <Link href="/" className="text-black font-bold underline underline-offset-4">Войти</Link>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <Suspense fallback={<div className="text-zinc-400">Загрузка...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}