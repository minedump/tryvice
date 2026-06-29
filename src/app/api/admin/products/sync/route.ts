import { FeedParser } from '@/lib/xml-parser';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { shop_id, xml_feed_url } = await req.json();

    if (!shop_id) {
      return Response.json({ error: 'Missing shop_id' }, { status: 400 });
    }

    let feedUrl = xml_feed_url;

    // Если URL не передан, берем его из базы
    if (!feedUrl) {
      const { data: shop, error } = await supabase
        .from('shops')
        .select('xml_feed_url')
        .eq('id', shop_id)
        .single();

      if (error || !shop?.xml_feed_url) {
        return Response.json({ error: 'Feed URL not configured' }, { status: 404 });
      }
      feedUrl = shop.xml_feed_url;
    }

    // Запускаем парсинг
    const result = await FeedParser.syncFeed(shop_id, feedUrl);

    return Response.json(result);

  } catch (err: any) {
    console.error('Sync API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
