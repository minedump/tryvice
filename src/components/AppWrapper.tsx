'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import LoadingScreen from './LoadingScreen';
import { usePathname, useRouter } from 'next/navigation';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, isSuperAdmin } = useAuth();
  const { loading: shopLoading, currentShop } = useShop();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Если магазин заблокирован и пользователь не суперадмин
    if (currentShop && !currentShop.is_active && !isSuperAdmin) {
      // Разрешаем только биллинг и профиль
      const allowedPaths = ['/admin/billing', '/admin/profile'];
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!isAllowed && pathname.startsWith('/admin')) {
        router.push('/admin/billing');
      }
    }
  }, [currentShop, isSuperAdmin, pathname, router]);

  // Показываем экран загрузки, пока инициализируются основные контексты
  if (authLoading || shopLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
