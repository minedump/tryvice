import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  
  try {
    const supabase = getSupabase();
    const { shop_id, domain } = await req.json();

    if (!shop_id) {
      return NextResponse.json({ error: 'Missing shop_id' }, { status: 400, headers: getCorsHeaders(origin) });
    }

    // Получаем данные магазина
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shop_id.trim())
      .maybeSingle();

    if (error || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: getCorsHeaders(origin) });
    }

    // Проверка домена (обязательно для CORS и безопасности)
    if (!shop.domain) {
      return NextResponse.json({ error: 'Shop domain not configured' }, { status: 403, headers: getCorsHeaders(origin) });
    }

    const cleanShopDomain = shop.domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
    const cleanRequestDomain = (domain || '').replace('www.', '');

    if (cleanRequestDomain && !cleanRequestDomain.includes(cleanShopDomain)) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 403, headers: getCorsHeaders(origin) });
    }

    // Если всё ок, используем origin из запроса для заголовка
    const headers = getCorsHeaders(origin);

    // Проверка баланса
    if (shop.remaining_generations <= 0) {
      return NextResponse.json({ 
        active: false, 
        reason: 'Insufficient balance' 
      }, { headers });
    }

    return NextResponse.json({
      active: true,
      settings: shop.widget_settings,
      shop_name: shop.name
    }, { headers });

  } catch (err) {
    console.error('Widget init error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
