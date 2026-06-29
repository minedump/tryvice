'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import { translateError } from '@/lib/error-translator';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = '/'; // Умный редирект с главной сам разберется
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkUser();

    if (searchParams.get('error') === 'expired') {
      setToast({
        message: 'Ссылка подтверждения просрочена. Пожалуйста, зарегистрируйтесь заново.',
        type: 'error'
      });
    }
  }, [searchParams, supabase]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(translateError(authError.message));
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

  if (isCheckingAuth) {
    return <div className="text-zinc-400 animate-pulse font-bold uppercase tracking-widest text-xs">Загрузка...</div>;
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-10">
      <div className="text-center mb-10">
        <Logo className="h-6 w-auto mx-auto text-black mb-4" />
        <p className="text-zinc-500 text-sm">Создайте аккаунт клиента</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="bg-zinc-50 text-black border border-zinc-200 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        <Input
          label="Имя"
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
          type={showPassword ? 'text' : 'password'}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          onIconClick={() => setShowPassword(!showPassword)}
        />
        <Input
          label="Подтверждение пароля"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          onIconClick={() => setShowPassword(!showPassword)}
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