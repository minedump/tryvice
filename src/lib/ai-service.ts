import 'server-only';
import { ImageAnalysisResult } from '@/types/ai';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.KODIKROUTER_API_KEY || '';
const API_URL = process.env.KODIKROUTER_API_URL || 'https://api.kodikrouter.ru/v1/chat/completions';
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models';

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

  public static async request(body: any, provider: 'kodik' | 'google' = 'kodik') {
    if (provider === 'google') {
      if (body.model.includes('imagen')) {
        return this.requestImagen(body);
      }
      return this.requestGemini(body);
    }

    console.log(`[AIService] Sending request to KodikRouter: ${API_URL}`);
    
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

  private static async requestImagen(body: any) {
    const modelName = body.model.includes('/') ? body.model : `models/${body.model}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:predict?key=${GEMINI_API_KEY}`;
    
    console.log(`[AIService] Request URL: ${url.replace(GEMINI_API_KEY, '***')}`);

    // Извлекаем текст промпта из сообщений
    const prompt = body.messages.map((m: any) => 
      Array.isArray(m.content) ? m.content.map((c: any) => c.text || '').join(' ') : m.content
    ).join('\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/jpeg"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API Error: ${errorText}`);
    }

    const data = await response.json();
    
    // Imagen возвращает base64 в поле bytes
    const base64Image = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return {
      choices: [{
        message: {
          content: imageUrl
        }
      }]
    };
  }

  private static async requestGemini(body: any) {
    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured in environment variables');
    }

    const modelName = body.model.includes('gemini') ? body.model : `gemini-1.5-flash`;
    const cleanModelName = modelName.split('/').pop(); // Берем только имя модели
    const url = `${GEMINI_API_URL}/${cleanModelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`[AIService] Requesting Gemini: ${cleanModelName}`);

    // Конвертируем формат OpenAI в формат Gemini с поддержкой base64
    const contents = await Promise.all(body.messages.map(async (m: any) => {
      const parts = await Promise.all((Array.isArray(m.content) ? m.content : [{ type: 'text', text: m.content }]).map(async (c: any) => {
        if (c.type === 'text') return { text: c.text };
        if (c.type === 'image_url') {
          try {
            const imageUrl = c.image_url.url;
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/jpeg';

            return {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            };
          } catch (err) {
            console.error('[AIService] Failed to fetch image for Gemini:', err);
            return null;
          }
        }
        return null;
      }));
      
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts.filter(p => p !== null)
      };
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AIService] Gemini Error Status: ${response.status}`);
      console.error(`[AIService] Gemini Error Body:`, errorText);
      throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Маппим ответ обратно в формат, который ожидает наш сервис
    return {
      choices: [{
        message: {
          content: data.candidates[0].content.parts[0].text
        }
      }]
    };
  }

  /**
   * Анализ изображения (модерация или классификация товара)
   */
  static async analyzeImage(imageUrl: string, mode: 'moderation' | 'classification'): Promise<ImageAnalysisResult> {
    const settings = await this.getSettings();
    const prompt = mode === 'moderation' ? settings.prompt_moderation : settings.prompt_classification;
    const model = mode === 'moderation' ? settings.model_moderation : settings.model_classification;
    const provider = mode === 'moderation' ? settings.provider_moderation : settings.provider_classification;

    console.log(`[AIService] Analyzing image via ${provider}/${model}: ${imageUrl}`);

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
    }, provider as any);

    const content = data.choices[0].message.content;
    console.log(`[AIService] AI Response for ${mode}:`, content);
    
    // Очистка от markdown блоков если Gemini их добавит
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanContent) as ImageAnalysisResult;
  }

  /**
   * Генерация примерки
   */
  static async generateTryOn(userImageUrl: string, productImageUrl: string, type: 'single' | 'outfit'): Promise<string> {
    const settings = await this.getSettings();
    const model = settings.model_generation;
    const provider = settings.provider_generation;
    
    console.log(`[AIService] Generating try-on via ${provider}. Model: ${model}, Type: ${type}`);

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
    }, provider as any);

    const content = data.choices[0].message.content;
    console.log(`[AIService] AI Response for generation:`, content);
    
    return content.trim();
  }
}
