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
    const hmacHeader = req.headers.get('Content-HMAC') || req.headers.get('x-content-hmac');

    if (!hmacHeader || !verifySignature(rawBody, hmacHeader)) {
      console.error('CloudPayments: Invalid signature');
      return Response.json({ code: 1, error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Парсим данные (CloudPayments шлет x-www-form-urlencoded)
    const params = new URLSearchParams(rawBody);
    const status = params.get('Status');
    const amount = parseFloat(params.get('Amount') || '0');
    const transactionId = params.get('TransactionId');
    
    // Пытаемся достать shop_id и tariff_id из Data (JSON строка)
    const dataJson = params.get('Data');
    let customData: any = {};
    try {
      if (dataJson) customData = JSON.parse(dataJson);
    } catch (e) {}

    const shopId = customData.shop_id || params.get('AccountId');
    const tariffId = customData.tariff_id;

    // 3. Обрабатываем только успешный платеж
    if (status === 'Completed') {
      if (!shopId) {
        console.error('CloudPayments: Missing shopId');
        return Response.json({ code: 0 });
      }

      let generationsToAdd = 0;
      let tariffName = 'Пополнение';

      if (tariffId) {
        // Логика по tariff_id
        const { data: tariff } = await supabase
          .from('tariffs')
          .select('*')
          .eq('id', tariffId)
          .single();
        
        if (tariff) {
          generationsToAdd = tariff.generations_limit;
          tariffName = tariff.name;
          
          // Обновляем тариф у магазина
          await supabase.from('shops').update({ tariff_id: tariff.id }).eq('id', shopId);
        }
      } else if (customData.type === 'package' && customData.generations) {
        // Логика покупки пакета примерок
        generationsToAdd = parseInt(customData.generations);
        tariffName = `Пакет +${generationsToAdd}`;
      }

      if (generationsToAdd > 0) {
        const { error } = await supabase.rpc('add_generations', {
          p_shop_id: shopId,
          p_amount: generationsToAdd,
          p_payment_amount: amount,
          p_description: `Оплата: ${tariffName} (Транзакция: ${transactionId})`
        });

        if (error) {
          console.error('CloudPayments: RPC error', error);
          // Ручное начисление если RPC не сработал
          const { data: shop } = await supabase.from('shops').select('remaining_generations').eq('id', shopId).single();
          await supabase.from('shops').update({
            remaining_generations: (shop?.remaining_generations || 0) + generationsToAdd
          }).eq('id', shopId);
          
          await supabase.from('transactions').insert({
            shop_id: shopId,
            amount: amount,
            type: customData.type || 'package',
            description: `Оплата: ${tariffName} (Manual)`
          });
        }
        
        console.log(`CloudPayments: Added ${generationsToAdd} gens to shop ${shopId}`);
      }
    }

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
