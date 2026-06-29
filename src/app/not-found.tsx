import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center">
        <Logo className="h-8 w-auto mx-auto text-black mb-12 opacity-20" />
        
        <h1 className="text-[120px] font-black leading-none tracking-tighter text-zinc-200 select-none">
          404
        </h1>
        
        <div className="relative -mt-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Страница не найдена</h2>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
            Похоже, вы зашли в примерочную, которой не существует. <br />
            Проверьте адрес или вернитесь на главную.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button size="L" className="w-full">
                ВЕРНУТЬСЯ НА ГЛАВНУЮ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
