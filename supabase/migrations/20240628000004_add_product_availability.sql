-- Добавление поля доступности товара из фида
ALTER TABLE products ADD COLUMN available BOOLEAN DEFAULT true;
