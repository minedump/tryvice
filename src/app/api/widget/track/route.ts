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
  'Access-Control-Allow-Origin': origin || '',
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
    const { shop_id, event_type, visitor_id, page_url, metadata } = await req.json();

    if (!shop_id || !event_type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400, headers: getCorsHeaders(origin) });
    }

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        shop_id,
        event_type,
        visitor_id,
        page_url,
        metadata
      });

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: getCorsHeaders(origin) });

  } catch (err: any) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: getCorsHeaders(origin) });
  }
}
