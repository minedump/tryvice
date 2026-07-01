# Навык: Эксперт по Recraft AI

Этот навык содержит правила и примеры использования API Recraft для проекта TryVice.

## Основные параметры
- **Base URL:** `https://external.api.recraft.ai/v1`
- **Auth:** `Authorization: Bearer RECRAFT_API_TOKEN`
- **Модели:** `recraftv4_1` (стандарт), `recraftv4_1_pro` (высокое качество).

## Ключевые эндпоинты

### 1. Image to Image (Основной для Try-On)
`POST /images/imageToImage`
- **image:** Файл (multipart/form-data).
- **prompt:** Описание изменений (например, "wearing a red silk dress").
- **strength:** Степень изменения (0 - копия, 1 - новое фото). Для примерки оптимально 0.4 - 0.7.
- **model:** `recraftv4_1`.

### 2. Inpainting (Для точной замены)
`POST /images/inpaint`
- **image:** Исходное фото.
- **mask:** ЧБ маска (белое - меняем, черное - оставляем).
- **prompt:** Что нарисовать в маске.

## Правила интеграции в TryVice
1. **Конвертация:** Recraft требует файлы (Blob/Buffer) в multipart/form-data, а не JSON с base64.
2. **Провайдер:** В `AIService` использовать идентификатор `recraft`.
3. **Обработка ошибок:** Всегда проверять `response.ok` и логировать тело ошибки.
4. **Формат ответа:** По умолчанию возвращает URL, можно запросить `b64_json` через `response_format`.
