import { AIService } from '@/lib/ai-service';
import { StorageService } from '@/lib/storage';
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
    const { shop_id, product_id, user_image_url, type, visitor_id, page_url } = await req.json();

    // 1. Валидация входных данных
    if (!shop_id || !user_image_url || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400, headers: getCorsHeaders(origin) });
    }

    let finalProductId = product_id;

    // 2. Если ID товара не передан, ищем по URL
    if (!finalProductId || finalProductId === 'null') {
      const { data: productByUrl } = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', shop_id)
        .eq('url', page_url)
        .maybeSingle();

      if (productByUrl) {
        finalProductId = productByUrl.id;
      } else {
        return NextResponse.json({ error: 'Product not found by URL' }, { status: 404, headers: getCorsHeaders(origin) });
      }
    }

    // 2. Проверка баланса магазина и получение настроек
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('remaining_generations, is_active')
      .eq('id', shop_id)
      .single();

    if (shopError || !shop || !shop.is_active || shop.remaining_generations <= 0) {
      return NextResponse.json({ error: 'Service unavailable or insufficient balance' }, { status: 403, headers: getCorsHeaders(origin) });
    }

    // 3. Поиск изображений товара (берем до 2-х штук согласно ТЗ)
    const { data: productImages, error: imgError } = await supabase
      .from('product_images')
      .select('url')
      .eq('product_id', finalProductId)
      .eq('type', type === 'outfit' ? 'outfit' : 'product')
      .order('is_preferred', { ascending: false })
      .limit(2);

    if (imgError || !productImages || productImages.length === 0) {
      return NextResponse.json({ error: 'Product images not found for this type' }, { status: 404, headers: getCorsHeaders(origin) });
    }

    // Используем первое (приоритетное) изображение для генерации
    const productImageUrl = productImages[0].url;

    // 4. Создание записи о генерации в статусе 'processing'
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .insert({
        shop_id,
        product_id: finalProductId,
        visitor_id,
        user_image_url: 'pending', // Обновим после загрузки
        type,
        status: 'processing'
      })
      .select()
      .single();

    if (genError) throw genError;

    try {
      // 4.1 Загружаем фото пользователя в наш Storage
      const userStorageUrl = await StorageService.uploadBase64(
        'user-photos',
        `${shop_id}/${generation.id}_user.jpg`,
        user_image_url
      );

      // 5. Запрос к NanoBanana
      const tempResultUrl = await AIService.generateTryOn(
        userStorageUrl,
        productImageUrl,
        type
      );

      // 5.1 Сохраняем результат в наш Storage для долгого хранения (180 дней)
      const finalResultUrl = await StorageService.uploadFromUrl(
        'generated-results',
        `${shop_id}/${generation.id}_result.jpg`,
        tempResultUrl
      );

      // 6. Обновление записи генерации и списание баланса
      const { error: updateError } = await supabase.rpc('complete_generation', {
        p_generation_id: generation.id,
        p_shop_id: shop_id,
        p_result_url: finalResultUrl
      });

      // Также обновим ссылку на фото пользователя
      await supabase
        .from('generations')
        .update({ user_image_url: userStorageUrl })
        .eq('id', generation.id);


      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        generation_id: generation.id,
        result_url: finalResultUrl
      }, { headers: getCorsHeaders(origin) });

    } catch (aiError: any) {
      // Обработка ошибки генерации
      await supabase
        .from('generations')
        .update({ status: 'failed', error_message: aiError.message })
        .eq('id', generation.id);
      
      throw aiError;
    }

  } catch (err: any) {
    console.error('Try-on error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: getCorsHeaders(origin) });
  }
}
