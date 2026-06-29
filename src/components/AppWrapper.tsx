'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import LoadingScreen from './LoadingScreen';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: shopLoading } = useShop();

  // Показываем экран загрузки, пока инициализируются основные контексты
  if (authLoading || shopLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
