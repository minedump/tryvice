'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useAuth } from './AuthContext';

interface ShopContextType {
  shops: any[];
  currentShop: any | null;
  setCurrentShop: (shop: any) => void;
  loading: boolean;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [currentShop, setCurrentShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShops = async () => {
    if (authLoading) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase.from('shops').select('*');
    
    if (!isSuperAdmin) {
      query = query.eq('owner_id', user.id);
    }

    const { data } = await query.order('created_at');

    if (data) {
      setShops(data);
      const activeShops = data.filter(s => s.is_active);
      const savedId = localStorage.getItem('current_shop_id');
      
      // Если в localStorage явно записано 'null', значит админ выбрал режим управления платформой
      if (isSuperAdmin && savedId === 'null') {
        setLoading(false);
        return;
      }

      let selected = data.find(s => s.id === savedId);

      if (selected && !selected.is_active && !isSuperAdmin) {
        selected = activeShops[0] || null;
      }

      // Если ничего не выбрано:
      // Для клиента — берем первый активный
      // Для админа — НЕ выбираем автоматически, позволяя остаться в режиме панели управления
      if (!selected && !isSuperAdmin) {
        selected = activeShops[0] || null;
      }

      if (!selected) {
        selected = isSuperAdmin ? data[0] : (activeShops[0] || null);
      }

      if (selected) {
        handleSetCurrentShop(selected);
      } else {
        handleSetCurrentShop(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, [isSuperAdmin, authLoading]);

  const handleSetCurrentShop = (shop: any | null) => {
    setCurrentShop(shop);
    if (shop) {
      localStorage.setItem('current_shop_id', shop.id);
    } else {
      // Явно записываем строку 'null', чтобы отличить от первой загрузки
      localStorage.setItem('current_shop_id', 'null');
    }
  };

  return (
    <ShopContext.Provider value={{ 
      shops, 
      currentShop, 
      setCurrentShop: handleSetCurrentShop, 
      loading, 
      refreshShops: fetchShops 
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
