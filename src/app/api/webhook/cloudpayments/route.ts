import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('Content-HMAC');

    if (!hmacHeader || !verifySignature(rawBody, hmacHeader)) {
      console.error('CloudPayments: Invalid signature');
      return Response.json({ code: 1, error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Парсим данные (CloudPayments шлет x-www-form-urlencoded)
    const params = new URLSearchParams(rawBody);
    const status = params.get('Status');
    const amount = parseFloat(params.get('Amount') || '0');
    const shopId = params.get('AccountId'); // Мы должны передавать shop_id в AccountId при создании платежа

    // 3. Обрабатываем только успешный платеж
    if (status === 'Completed') {
      if (!shopId) {
        return Response.json({ code: 1, error: 'Missing AccountId' });
      }

      // Логика определения количества примерок согласно ТЗ
      let generationsToAdd = 0;
      if (amount >= 50000) generationsToAdd = 500;
      else if (amount >= 20000) generationsToAdd = 200;
      else if (amount >= 5000) generationsToAdd = 50;

      if (generationsToAdd > 0) {
        const { error } = await supabase.rpc('add_generations', {
          p_shop_id: shopId,
          p_count: generationsToAdd
        });

        if (error) throw error;
        console.log(`CloudPayments: Added ${generationsToAdd} gens to shop ${shopId}`);
      }
    }

    // 4. Успешный ответ согласно документации
    return Response.json({ code: 0 });

  } catch (err: any) {
    console.error('CloudPayments Webhook Error:', err);
    return Response.json({ code: 1, error: err.message }, { status: 500 });
  }
}

function verifySignature(body: string, hmac: string) {
  const expectedHmac = crypto
    .createHmac('sha256', process.env.CLOUDPAYMENTS_API_SECRET!)
    .update(body)
    .digest('base64');
  return expectedHmac === hmac;
}
