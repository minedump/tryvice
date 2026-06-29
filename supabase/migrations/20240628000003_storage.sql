-- Создание бакетов для хранения изображений
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-results', 'generated-results', true);

-- Политики доступа для бакета user-photos (загрузка разрешена всем анонимным пользователям виджета)
CREATE POLICY "Allow public upload to user-photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Allow public read of own photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-photos');

-- Политика для результатов (публичный доступ)
CREATE POLICY "Public access to generated results" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'generated-results');
