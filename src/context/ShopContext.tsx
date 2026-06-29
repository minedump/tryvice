'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [shops, setShops] = useState<any[]>([]);
  const [currentShop, setCurrentShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShops = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at');

    if (data) {
      setShops(data);
      // Если магазин уже был выбран, сохраняем его, иначе берем первый
      const savedId = localStorage.getItem('current_shop_id');
      const selected = data.find(s => s.id === savedId) || data[0];
      if (selected) {
        setCurrentShop(selected);
        localStorage.setItem('current_shop_id', selected.id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSetCurrentShop = (shop: any | null) => {
    setCurrentShop(shop);
    if (shop) {
      localStorage.setItem('current_shop_id', shop.id);
    } else {
      localStorage.removeItem('current_shop_id');
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
