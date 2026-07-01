import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { shop_id, domain } = await req.json();

    if (!shop_id) {
      return Response.json({ error: 'Missing shop_id' }, { status: 400, headers: corsHeaders });
    }

    // Получаем данные магазина
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shop_id)
      .single();

    if (error || !shop) {
      return Response.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
    }

    // Проверка домена (обязательно для CORS и безопасности)
    if (!shop.domain) {
      return Response.json({ error: 'Shop domain not configured' }, { status: 403, headers: corsHeaders });
    }

    if (domain && !domain.includes(shop.domain.replace('https://', '').replace('http://', ''))) {
      return Response.json({ error: 'Invalid domain' }, { status: 403, headers: corsHeaders });
    }

    // Проверка баланса
    if (shop.remaining_generations <= 0) {
      return Response.json({ 
        active: false, 
        reason: 'Insufficient balance' 
      }, { headers: corsHeaders });
    }

    return Response.json({
      active: true,
      settings: shop.widget_settings,
      shop_name: shop.name
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Widget init error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
