import { ImageAnalysisResult, NanoBananaResponse } from '@/types/ai';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.NANOBANANA_API_KEY;
const API_URL = (process.env.NANOBANANA_API_URL || 'https://kodikrouter.ru/api/v1').replace(/\/$/, '');

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class AIService {
  private static cachedPrompts: any = null;

  private static async getPrompts() {
    if (this.cachedPrompts) return this.cachedPrompts;
    
    const supabase = getSupabase();
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'prompts')
      .single();

    this.cachedPrompts = data?.value || {
      generation_base: "Virtual try-on: put the clothing from the product image onto the person in the user image.",
      analysis_moderation: "Analyze the photo. Is it suitable for virtual clothing try-on? Requirements: person visible in full height or waist-up, clear image, no objects blocking the body. Return JSON: { \"suitable\": boolean, \"reason\": string | null }",
      analysis_classification: "Is this image a single product on a neutral background (flat lay or headless mannequin) or an 'outfit' (look) — a model in full height with surroundings? Also determine if the object is actually clothing. Return JSON: { \"type\": \"product\" | \"outfit\", \"is_clothing\": boolean }"
    };
    
    return this.cachedPrompts;
  }

  public static async request(endpoint: string, body: any) {
    // Итоговый путь согласно документации и вашему примеру
    const fullUrl = 'https://api.kodikrouter.ru/v1/chat/completions';
    console.log(`[AIService] Sending request to: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {

      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Если вернулся HTML (обычно это 404 страница), выводим только статус
      if (errorText.includes('<!DOCTYPE html>') || response.status === 404) {
        console.error(`[AIService] Error Response from ${fullUrl}: Status ${response.status} (Page not found)`);
        throw new Error(`AI Service Error: Status ${response.status}`);
      }
      
      console.error(`[AIService] Error Response from ${fullUrl}:`, errorText);
      throw new Error(`AI Service Error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * ТЕСТОВЫЙ МЕТОД: Проверка доступности модели без картинки
   */
  /**
   * Анализ изображения (модерация или классификация товара)
   */
  static async analyzeImage(imageUrl: string, mode: 'moderation' | 'classification'): Promise<ImageAnalysisResult> {
    const prompts = await this.getPrompts();
    const prompt = mode === 'moderation' ? prompts.analysis_moderation : prompts.analysis_classification;

    console.log(`[AIService] Analyzing image via GPT-4o-mini: ${imageUrl}`);

    const data = await this.request('/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = data.choices[0].message.content;
    console.log(`[AIService] AI Response for ${mode}:`, content);
    
    const result = JSON.parse(content) as ImageAnalysisResult;
    return result;
  }

  /**
   * Генерация примерки
   */
  static async generateTryOn(userImageUrl: string, productImageId: string, type: 'single' | 'outfit'): Promise<string> {
    const prompts = await this.getPrompts();
    // В ТЗ указана модель google/gemini-3.1-flash-image-preview для генерации
    const data = await this.request('/images/generations', {
      model: 'google/gemini-3.1-flash-image-preview',
      prompt: `${prompts.generation_base} Mode: ${type}`,
      user_image: userImageUrl,
      product_image: productImageId,
    });

    return data.url;
  }
}
