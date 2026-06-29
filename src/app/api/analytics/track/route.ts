import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Используем service role для записи событий без авторизации
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shop_id, event_type, visitor_id, page_url } = body;

    if (!shop_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('analytics_events')
      .insert([{
        shop_id,
        event_type,
        visitor_id,
        page_url
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Analytics tracking error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
