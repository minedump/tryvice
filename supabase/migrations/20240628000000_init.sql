-- Таблица профилей (админы магазинов)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица магазинов
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT, -- Разрешенный домен для виджета
  xml_feed_url TEXT,
  widget_settings JSONB DEFAULT '{
    "primary_color": "#000000",
    "button_text": "Примерить",
    "consent_html": "Нажимая на кнопку «Загрузить фото», вы соглашаетесь с Политикой конфиденциальности"
  }'::jsonb,
  remaining_generations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- ID из XML-фида
  name TEXT NOT NULL,
  price DECIMAL,
  category TEXT,
  url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, external_id)
);

-- Таблица изображений товаров (после анализа AI)
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('product', 'outfit')),
  hash TEXT, -- Для защиты от повторного анализа
  is_preferred BOOLEAN DEFAULT false, -- Выбрано ли как основное для генерации
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица генераций (примерок)
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  visitor_id UUID NOT NULL, -- Анонимный ID из кук
  user_image_url TEXT NOT NULL,
  result_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  type TEXT CHECK (type IN ('single', 'outfit')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица логов доступа к изображениям (для очистки через 180 дней)
CREATE TABLE image_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_path TEXT NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Политики: Владелец видит только свои данные
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own shops" ON shops FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can view products of own shops" ON products FOR SELECT 
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "Users can view images of own products" ON product_images FOR SELECT 
  USING (product_id IN (SELECT id FROM products WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())));
CREATE POLICY "Users can view generations of own shops" ON generations FOR SELECT 
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
