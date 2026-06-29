import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { shop_id, domain } = await req.json();

    if (!shop_id) {
      return Response.json({ error: 'Missing shop_id' }, { status: 400 });
    }

    // Получаем данные магазина
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shop_id)
      .single();

    if (error || !shop) {
      return Response.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Проверка домена (если указан в настройках)
    if (shop.domain && domain && !domain.includes(shop.domain)) {
      return Response.json({ error: 'Invalid domain' }, { status: 403 });
    }

    // Проверка баланса
    if (shop.remaining_generations <= 0) {
      return Response.json({ 
        active: false, 
        reason: 'Insufficient balance' 
      });
    }

    return Response.json({
      active: true,
      settings: shop.widget_settings,
      shop_name: shop.name
    });

  } catch (err) {
    console.error('Widget init error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
