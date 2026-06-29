'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import { translateError } from '@/lib/error-translator';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function RootPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Если пользователь авторизован, определяем куда его отправить
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          window.location.href = '/superadmin/clients';
          return;
        }

        const { data: shops } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id);

        const savedShopId = localStorage.getItem('current_shop_id');

        if (!shops || shops.length === 0 || savedShopId === 'null') {
          window.location.href = '/admin/settings';
        } else {
          window.location.href = '/admin/dashboard';
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkUser();

    // Обработка ошибок из URL
    const hash = window.location.hash;
    if (hash.includes('error=access_denied')) {
      router.push('/register?error=expired');
    }
  }, [router, supabase]);

  const handleResend = async () => {
    if (!email) {
      setError('Введите email, чтобы получить новую ссылку');
      return;
    }
    setResending(true);
    setError(null);
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setInfo('Новая ссылка отправлена на вашу почту');
      setError(null);
    }
    setResending(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(translateError(authError.message));
      setLoading(false);
      return;
    }

    // Проверяем роль и наличие магазинов
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      window.location.href = '/superadmin/clients';
    } else {
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', data.user.id);

      if (!shops || shops.length === 0) {
        window.location.href = '/admin/settings';
      } else {
        window.location.href = '/admin/dashboard';
      }
    }
    router.refresh();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400 animate-pulse font-bold uppercase tracking-widest text-xs">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-10">
        <div className="text-center mb-10">
          <Logo className="h-6 w-auto mx-auto text-black mb-4" />
          <p className="text-zinc-500 text-sm">Войдите в систему</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-zinc-50 text-black border border-zinc-200 p-3 rounded-lg text-sm text-center flex flex-col gap-2">
              <span>{error}</span>
              {error.includes('просрочена') && (
                <button 
                  type="button" 
                  onClick={handleResend}
                  className="text-xs font-bold underline uppercase tracking-widest hover:text-zinc-600"
                  disabled={resending}
                >
                  {resending ? 'Отправка...' : 'Отправить ссылку повторно'}
                </button>
              )}
            </div>
          )}
          {info && (
            <div className="bg-zinc-900 text-white p-3 rounded-lg text-sm text-center">
              {info}
            </div>
          )}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            onIconClick={() => setShowPassword(!showPassword)}
          />
          <Button
            type="submit"
            disabled={loading}
            size="L"
            className="w-full"
          >
            {loading ? 'ВХОД...' : 'ВОЙТИ'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Нет аккаунта? <Link href="/register" className="text-black font-bold underline underline-offset-4">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
