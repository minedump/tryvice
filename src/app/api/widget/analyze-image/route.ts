import { AIService } from '@/lib/ai-service';
import { StorageService } from '@/lib/storage';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { image_url, shop_id, visitor_id } = await req.json();

    if (!image_url || !shop_id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({
        suitable: cached.suitable,
        reason: cached.reason,
        image_url: cached.storage_url
      }, { headers: corsHeaders });
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

    return NextResponse.json({
      ...analysis,
      image_url: storageUrl
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('Image analysis error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}