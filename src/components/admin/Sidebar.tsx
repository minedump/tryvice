'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconShirt,
  IconHistory,
  IconChartBar,
  IconSettings,
  IconUsers,
  IconPrompt,
  IconCreditCard,
  IconUserCircle,
  IconWallet
} from '@tabler/icons-react';
import LogoutButton from '@/components/LogoutButton';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentShop } = useShop();
  const { isSuperAdmin } = useAuth();

  const isCreatingNew = pathname === '/admin/settings' && searchParams.get('action') === 'new';
  const hasActiveShop = !!currentShop && !isCreatingNew;
  const isBlocked = currentShop && !currentShop.is_active && !isSuperAdmin;

  return (
    <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col">
      {isSuperAdmin && !currentShop ? (
        <div></div>
      ) : (
        <div className="py-4 px-8 border-b border-zinc-100">
          <div className="text-sm font-bold truncate">
            {currentShop?.name || 'Не выбран'}
          </div>
        </div>
      )}

      <nav className="mt-6 px-4 space-y-1 flex-1">
        {isSuperAdmin && !currentShop ? (
          <>
            <NavLink href="/superadmin/clients" icon={<IconUsers size={22} />} label="Клиенты" active={pathname.startsWith('/superadmin/clients')} />
            <NavLink href="/superadmin/prompts" icon={<IconPrompt size={22} />} label="Промпты AI" active={pathname.startsWith('/superadmin/prompts')} />
            <NavLink href="/superadmin/tariffs" icon={<IconCreditCard size={22} />} label="Тарифы" active={pathname.startsWith('/superadmin/tariffs')} />
          </>
        ) : (
          <>
            {hasActiveShop ? (
              <>
                {!isBlocked ? (
                  <>
                    <NavLink href="/admin/dashboard" icon={<IconLayoutDashboard size={22} />} label="Дашборд" active={pathname === '/admin/dashboard'} />
                    <NavLink href="/admin/history" icon={<IconHistory size={22} />} label="История" active={pathname === '/admin/history'} />
                    <NavLink href="/admin/products" icon={<IconShirt size={22} />} label="Товары" active={pathname === '/admin/products'} />
                    <NavLink href="/admin/analytics" icon={<IconChartBar size={22} />} label="Аналитика" active={pathname === '/admin/analytics'} />
                    <NavLink href="/admin/billing" icon={<IconWallet size={22} />} label="Биллинг" active={pathname === '/admin/billing'} />
                    <NavLink href="/admin/settings" icon={<IconSettings size={22} />} label="Настройки" active={pathname === '/admin/settings'} />
                  </>
                ) : (
                  <>
                    <NavLink href="/admin/billing" icon={<IconWallet size={22} />} label="Биллинг" active={pathname === '/admin/billing'} />
                  </>
                )}
              </>
            ) : (
              <NavLink href="/admin/settings?action=new" icon={<IconSettings size={22} />} label="Создать магазин" active={pathname === '/admin/settings'} />
            )}
          </>
        )}
      </nav>
      
      <div className="px-4 pb-6 space-y-1">
        <NavLink 
          href={isSuperAdmin ? "/superadmin/profile" : "/admin/profile"} 
          icon={<IconUserCircle size={22} />} 
          label="Профиль" 
          active={pathname.includes('/profile')} 
        />
        <LogoutButton />
      </div>
    </aside>
  );
}

function NavLink({ href, icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
