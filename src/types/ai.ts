export type ImageAnalysisResult = {
  suitable: boolean;
  reason: string | null;
  type?: 'product' | 'outfit' | 'not_clothing';
  is_clothing?: boolean;
};

export type GenerationRequest = {
  shop_id: string;
  product_id: string;
  image_url: string; // Фото пользователя
  product_image_url: string; // Фото товара/образа
  type: 'single' | 'outfit';
};

export type NanoBananaResponse = {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  output_url?: string;
  error?: string;
};
