import { AIService } from '@/lib/ai-service';
import { StorageService } from '@/lib/storage';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { image_url, shop_id, visitor_id } = await req.json();

    if (!image_url || !shop_id) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Проверка хеша для кеширования результатов
    const hash = crypto.createHash('md5').update(image_url).digest('hex');
    
    // Проверяем, не анализировали ли мы это фото ранее
    const { data: cached } = await supabase
      .from('image_analysis_cache')
      .select('*')
      .eq('hash', hash)
      .maybeSingle();

    if (cached) {
      console.log('[Analyze] Using cached result for hash:', hash);
      return Response.json({
        suitable: cached.suitable,
        reason: cached.reason,
        image_url: cached.storage_url
      });
    }

    // 2. Вызов AI для модерации
    const analysis = await AIService.analyzeImage(image_url, 'moderation');

    let storageUrl = null;

    // 3. Если фото подходит, загружаем его в Storage
    if (analysis.suitable) {
      storageUrl = await StorageService.uploadBase64(
        'user-photos',
        `${shop_id}/${visitor_id || 'anon'}_${Date.now()}.jpg`,
        image_url
      );
    }

    // 4. Сохраняем в кеш
    await supabase.from('image_analysis_cache').insert({
      hash,
      suitable: analysis.suitable,
      reason: analysis.reason,
      storage_url: storageUrl
    });

    return Response.json({
      ...analysis,
      image_url: storageUrl
    });

  } catch (err: any) {
    console.error('Image analysis error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
