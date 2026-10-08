import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const isCryptoEnabled = process.env.ENABLE_CRYPTO === 'true';
    if (!isCryptoEnabled) {
      return NextResponse.json({ message: 'Crypto webhook disabled' }, { status: 200 });
    }

    const body = await req.json();
    const hmacHeader = req.headers.get('x-nowpayments-sig');

    // ตรวจสอบ Signature จาก NOWPayments IPN
    if (process.env.NOWPAYMENTS_IPN_SECRET && hmacHeader) {
      const sortedKeys = Object.keys(body).sort();
      const sortedObj = {};
      sortedKeys.forEach((key) => {
        sortedObj[key] = body[key];
      });
      const jsonString = JSON.stringify(sortedObj);
      const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
      hmac.update(jsonString);
      const calculatedSignature = hmac.digest('hex');

      if (calculatedSignature !== hmacHeader) {
        console.warn('Invalid NOWPayments IPN signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // เมื่อการชำระเงินเสร็จสมบูรณ์ (payment_status: 'finished')
    if (body.payment_status === 'finished') {
      const orderId = body.order_id;
      const actualAmount = body.price_amount;
      console.log(`[Crypto Webhook] Payment finished! Order: ${orderId}, USD: ${actualAmount}`);
      // บันทึกเติมเงินเข้าบัญชีผู้ใช้
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Crypto webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
