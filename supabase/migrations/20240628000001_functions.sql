-- Функция для завершения генерации и списания баланса
CREATE OR REPLACE FUNCTION complete_generation(
  p_generation_id UUID,
  p_shop_id UUID,
  p_result_url TEXT
)
RETURNS VOID AS $$
BEGIN
  -- 1. Обновляем статус генерации
  UPDATE generations
  SET 
    status = 'completed',
    result_image_url = p_result_url
  WHERE id = p_generation_id;

  -- 2. Списываем 1 генерацию у магазина
  UPDATE shops
  SET remaining_generations = remaining_generations - 1
  WHERE id = p_shop_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для пополнения баланса
CREATE OR REPLACE FUNCTION add_generations(
  p_shop_id UUID,
  p_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE shops
  SET remaining_generations = remaining_generations + p_count
  WHERE id = p_shop_id;
END;
$$ LANGUAGE plpgsql;

