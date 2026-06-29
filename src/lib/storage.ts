import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StorageService {
  static async uploadBase64(bucket: string, path: string, base64Data: string): Promise<string> {
    const supabase = getSupabase();    // Убираем префикс data:image/jpeg;base64,
    const base64 = base64Data.split(',')[1] || base64Data;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  /**
   * Загружает изображение по URL (например, результат от NanoBanana)
   */
  static async uploadFromUrl(bucket: string, path: string, url: string): Promise<string> {
    const supabase = getSupabase();
    const response = await fetch(url);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }
}
