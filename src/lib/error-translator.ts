export function translateError(error: string | undefined | null): string {
  if (!error) return '';

  const errorMap: Record<string, string> = {
    // Сетевые ошибки
    'NetworkError when attempting to fetch resource.': 'Ошибка сети. Проверьте подключение к интернету.',
    'Failed to fetch': 'Не удалось связаться с сервером. Попробуйте позже.',
    'TypeError: Failed to fetch': 'Ошибка соединения с сервером.',

    // Ошибки авторизации Supabase
    'Invalid login credentials': 'Неверный email или пароль.',
    'User already registered': 'Пользователь с таким email уже зарегистрирован.',
    'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов.',
    'Email not confirmed': 'Пожалуйста, подтвердите ваш email.',
    'Signup disabled': 'Регистрация временно отключена.',
    'Rate limit exceeded': 'Слишком много попыток. Попробуйте позже.',
    'User not found': 'Пользователь не найден.',
    'Invalid email': 'Некорректный формат email.',
  };

  // Ищем точное совпадение или частичное вхождение
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value;
  }

  // Если перевод не найден, возвращаем оригинал или общую фразу
  return error;
}
