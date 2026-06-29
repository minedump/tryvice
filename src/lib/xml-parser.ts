import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import { AIService } from './ai-service';
import crypto from 'crypto';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};


export class FeedParser {
  static async validateFeed(feedUrl: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) return { valid: false, error: `Failed to fetch URL: ${response.statusText}` };
      
      const xmlData = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
      const jsonObj = parser.parse(xmlData);

      const shop = jsonObj.yml_catalog?.shop;
      if (!shop) return { valid: false, error: "Invalid structure: <yml_catalog> or <shop> not found" };

      const offers = shop.offers?.offer;
      if (!offers) return { valid: false, error: "No <offers> found in feed" };

      const firstOffer = Array.isArray(offers) ? offers[0] : offers;
      
      // Проверка обязательных полей в оффере
      const requiredFields = ['id', 'name', 'price'];
      for (const field of requiredFields) {
        if (firstOffer[field] === undefined) {
          return { valid: false, error: `Offer is missing required field: ${field}` };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  static async syncFeed(shopId: string, feedUrl: string) {
    const supabase = getSupabase();    try {
      console.log(`[FeedParser] Starting sync for shop ${shopId}. URL: ${feedUrl}`);
      const response = await fetch(feedUrl);
      const xmlData = await response.text();
      
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
      const jsonObj = parser.parse(xmlData);
      
      // 1. Создаем карту категорий
      const categories = jsonObj.yml_catalog?.shop?.categories?.category;
      const categoryMap = new Map<string, string>();
      if (categories) {
        const catArray = Array.isArray(categories) ? categories : [categories];
        catArray.forEach((cat: any) => {
          categoryMap.set(cat.id.toString(), cat["#text"] || cat.name || "");
        });
      }

      const offers = jsonObj.yml_catalog?.shop?.offers?.offer;
      if (!offers) {
        console.error('[FeedParser] No offers found in XML structure');
        throw new Error('No offers found in feed');
      }

      const offersArray = Array.isArray(offers) ? offers : [offers];
      console.log(`[FeedParser] Found ${offersArray.length} offers to process`);

      let count = 0;
      for (const offer of offersArray) {
        count++;
        if (count % 10 === 0 || count === offersArray.length) {
          console.log(`[FeedParser] Processing: ${count}/${offersArray.length}`);
        }
        await this.processOffer(shopId, offer, categoryMap);
      }

      console.log(`[FeedParser] Sync completed successfully for shop ${shopId}`);
      return { success: true, processed: offersArray.length };
    } catch (error) {
      console.error('Feed sync error:', error);
      throw error;
    }
  }

  private static async processOffer(shopId: string, offer: any, categoryMap: Map<string, string>) {
    const supabase = getSupabase();
    
    const categoryId = offer.categoryId?.toString();
    const categoryName = categoryId ? categoryMap.get(categoryId) || categoryId : null;

    const productData = {
      shop_id: shopId,
      external_id: offer.id.toString(),
      name: offer.name,
      price: offer.price,
      category: categoryName,
      url: offer.url,
      available: offer.available !== 'false' && offer.available !== false,
    };

    const { data: product, error: pError } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'shop_id, external_id' })
      .select()
      .single();

    if (pError || !product) return;

    const pictures = Array.isArray(offer.picture) ? offer.picture : [offer.picture];
    
    for (const picUrl of pictures) {
      if (!picUrl) continue;

      // 1. Генерируем хеш (название файла из URL)
      // Так как мы не хотим скачивать файл для получения веса (это медленно),
      // используем URL как основу для хеша, если вес недоступен.
      // Но по ТЗ: название файла + вес. Попробуем получить HEAD запрос для веса.
      let hash = '';
      try {
        const headRes = await fetch(picUrl, { method: 'HEAD' });
        const size = headRes.headers.get('content-length') || '0';
        const fileName = picUrl.split('/').pop() || '';
        hash = crypto.createHash('md5').update(fileName + size).digest('hex');
      } catch (e) {
        hash = crypto.createHash('md5').update(picUrl).digest('hex');
      }

      // 2. Проверяем наличие в базе по URL или хешу
      const { data: existing } = await supabase
        .from('product_images')
        .select('id, type')
        .or(`url.eq.${picUrl},hash.eq.${hash}`)
        .maybeSingle();

      let imageId = existing?.id;
      let currentType = existing?.type || 'not_processed';

      // 3. Если изображения нет - создаем
      if (!existing) {
        const { data: inserted } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: picUrl,
            hash: hash,
            type: 'not_processed',
            is_preferred: false
          })
          .select()
          .single();
        imageId = inserted?.id;
      }

      // 4. Если тип 'not_processed', пытаемся обработать через ИИ
      if (currentType === 'not_processed' && imageId) {
        try {
          const analysis = await AIService.analyzeImage(picUrl, 'classification');
          
          let finalType: 'product' | 'outfit' | 'not_clothing' = 'product';

          if (analysis.is_clothing === false) {
            finalType = 'not_clothing';
          } else {
            finalType = analysis.type === 'outfit' ? 'outfit' : 'product';
          }

          await supabase
            .from('product_images')
            .update({
              type: finalType
            })
            .eq('id', imageId);
            
          console.log(`[FeedParser] Image ${picUrl} processed as: ${finalType}`);
            
        } catch (err: any) {
          console.warn(`[FeedParser] AI analysis failed for ${picUrl}:`, err.message);
          // Оставляем тип not_processed для следующей попытки
        }
      }
    }
  }

  private static async saveImage(productId: string, url: string, type: 'product' | 'outfit') {
    const supabase = getSupabase();
    await supabase.from('product_images').insert({
      product_id: productId,
      url: url,
      type: type,
      is_preferred: true // Для простоты помечаем первые найденные как предпочтительные
    });
  }
}
