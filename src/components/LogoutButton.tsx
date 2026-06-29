'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { IconLogout } from '@tabler/icons-react';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all w-full"
    >
      <IconLogout size={22} />
      <span className="text-sm font-medium">Выйти</span>
    </button>
  );
}
