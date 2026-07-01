import 'server-only';
import { ImageAnalysisResult } from '@/types/ai';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.KODIKROUTER_API_KEY || '';
const API_URL = process.env.KODIKROUTER_API_URL || 'https://api.kodikrouter.ru/v1/chat/completions';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class AIService {
  private static cachedSettings: any = null;

  private static async getSettings() {
    if (this.cachedSettings) return this.cachedSettings;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      console.error('[AIService] Platform settings not found in DB!');
      throw new Error('AI settings not configured. Please set them in Superadmin panel.');
    }

    this.cachedSettings = data;
    return data;
  }

  public static async request(body: any) {
    console.log(`[AIService] Sending request to: ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AIService] Error Response from ${API_URL}:`, errorText);
      throw new Error(`AI Service Error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Анализ изображения (модерация или классификация товара)
   */
  static async analyzeImage(imageUrl: string, mode: 'moderation' | 'classification'): Promise<ImageAnalysisResult> {
    const settings = await this.getSettings();
    const prompt = mode === 'moderation' ? settings.prompt_moderation : settings.prompt_classification;
    const model = mode === 'moderation' ? settings.model_moderation : settings.model_classification;

    console.log(`[AIService] Analyzing image via ${model}: ${imageUrl}`);

    const data = await this.request({
      model: model,
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
    
    return JSON.parse(content) as ImageAnalysisResult;
  }

  /**
   * Генерация примерки
   */
  static async generateTryOn(userImageUrl: string, productImageUrl: string, type: 'single' | 'outfit'): Promise<string> {
    const settings = await this.getSettings();
    const model = settings.model_generation;
    
    console.log(`[AIService] Generating try-on via KodikRouter. Model: ${model}, Type: ${type}`);

    const data = await this.request({
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `${settings.prompt_generation} Mode: ${type}. Category: ${type === 'outfit' ? 'overall' : 'top'}` 
            },
            {
              type: 'image_url',
              image_url: { url: userImageUrl }
            },
            {
              type: 'image_url',
              image_url: { url: productImageUrl }
            }
          ]
        }
      ]
    });

    const content = data.choices[0].message.content;
    console.log(`[AIService] AI Response for generation:`, content);
    
    return content.trim();
  }
}
