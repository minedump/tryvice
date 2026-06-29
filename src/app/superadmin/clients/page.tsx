import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ClientsPage() {
  const supabase = getSupabase();
  const { data: shops } = await supabase
    .from('shops')
    .select(`
      *,
      profiles (email)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight mb-10">Управление клиентами</h2>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Магазин / Владелец</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Баланс</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Домен</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {shops?.map((shop: any) => (
              <tr key={shop.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="font-semibold text-zinc-900">{shop.name}</div>
                  <div className="text-xs text-zinc-400">{shop.profiles?.email}</div>
                </td>
                <td className="px-6 py-5">
                  <span className={`font-bold ${shop.remaining_generations < 10 ? 'text-red-600' : 'text-black'}`}>
                    {shop.remaining_generations}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-zinc-500">{shop.domain || '—'}</td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.is_active ? 'bg-zinc-100 text-zinc-800' : 'bg-red-50 text-red-700'}`}>
                    {shop.is_active ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <button className="text-black font-bold text-xs uppercase tracking-widest hover:underline mr-4">Правка</button>
                  <button className="text-red-600 font-bold text-xs uppercase tracking-widest hover:underline">{shop.is_active ? 'Блок' : 'Разблок'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
