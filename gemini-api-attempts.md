# История попыток интеграции Gemini API (через KodikRouter)

В этом документе зафиксированы рабочие эндпоинты и структуры запросов, которые мы использовали для анализа изображений товаров и модерации фото пользователей.

## 1. Рабочий эндпоинт

Для всех запросов использовался прокси-сервис KodikRouter:
`https://api.vibekodik.ru/v1/chat/completions`

**Заголовки:**
- `Content-Type: application/json`
- `Authorization: Bearer ${NANO_BANANA_API_KEY}`

---

## 2. Попытки через URL (Самый стабильный формат)

Этот формат использовался для анализа товаров из XML-фида, так как изображения уже имели публичные ссылки.

### Пример запроса:
```json
{
  "model": "google/gemini-2.0-flash-exp",
  "messages": [
    {
      "role": "user",
      "content": [
        { 
          "type": "text", 
          "text": "На этом изображении представлен только один товар на белом фоне (product) или это образ на модели (outfit)? Верни JSON: { \"type\": \"product\" | \"outfit\" }" 
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/path-to-image.jpg"
          }
        }
      ]
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Проблема:** Модель часто игнорировала `response_format` или отклоняла запрос по соображениям безопасности (Safety Settings), если на фото был человек.

---

## 3. Попытки через Base64 (Формат OpenAI)

Мы пытались передавать изображения в формате Data URI, что является стандартом для OpenAI-совместимых API.

### Пример запроса:
```json
{
  "model": "google/gemini-2.0-flash-exp",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Проверь фото на пригодность для примерки." },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
          }
        }
      ]
    }
  ]
}
```

**Проблема:** 
1. **Payload Too Large:** При больших изображениях KodikRouter или целевой сервер обрывали соединение.
2. **Syntax Error:** Некоторые версии роутера не могли корректно обработать спецсимволы внутри Base64 строки в JSON.

---

## 4. Попытки через нативный формат Google (inline_data)

Попытка обойти ограничения прокси, используя структуру, которую Gemini ожидает напрямую.

### Пример запроса:
```json
{
  "model": "google/gemini-2.0-flash-exp",
  "messages": [
    {
      "role": "user",
      "content": [
        { "text": "Analyze this image" },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "/9j/4AAQSkZJRgABAQAAAQABAAD..." 
          }
        }
      ]
    }
  ]
}
```

**Проблема:** Ошибка `Request rejected by model`. Модель Gemini блокировала запросы с изображениями людей из-за жестких фильтров безопасности (Safety Filters), которые невозможно было отключить через текущий прокси-слой.

---

## 5. Итоговое решение (Fallback)

Из-за нестабильности API для автоматической классификации был внедрен механизм "заглушки" в `src/lib/ai-service.ts`:

```typescript
// Если AI не отвечает или выдает ошибку, считаем товар подходящим по умолчанию
if (error || !response) {
  return { 
    type: 'product', 
    suitable: true, 
    reason: 'AI fallback active' 
  };
}
```
