-- Таблица глобальных настроек платформы
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Начальные промпты
INSERT INTO platform_settings (key, value) VALUES 
('prompts', '{
  "generation_base": "Virtual try-on: put the clothing from the product image onto the person in the user image.",
  "analysis_moderation": "Проанализируй фото. Подходит ли оно для виртуальной примерки одежды? Требования: человек виден в полный рост или по пояс, четкое изображение, отсутствие посторонних предметов, перекрывающих тело. Верни JSON: { \"suitable\": boolean, \"reason\": string | null }",
  "analysis_classification": "На этом изображении представлен только один товар на белом/нейтральном фоне (flat lay или на манекене без головы) или это ''образ'' (look) — модель в полный рост в окружении? Верни JSON: { \"type\": \"product\" | \"outfit\" }"
}'::jsonb);

-- Добавляем роль в профиль
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin'));
