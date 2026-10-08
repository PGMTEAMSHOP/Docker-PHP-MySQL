import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // ตรวจสอบสถานะการเปิด/ปิดระบบชำระเงิน Crypto
    const isCryptoEnabled = process.env.ENABLE_CRYPTO === 'true';
    if (!isCryptoEnabled || !process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'ระบบชำระเงินผ่านคริปโต ปิดปรับปรุงชั่วคราว (Coming Soon)' },
        { status: 503 }
      );
    }

    const { amountThb, userId, payCurrency = 'usdttrc20' } = await req.json();

    if (!amountThb || parseFloat(amountThb) < 50) {
      return NextResponse.json(
        { error: 'ยอดชำระคริปโตขั้นต่ำ 50 บาท' },
        { status: 400 }
      );
    }

    // แปลงเงินบาทเป็นประมาณการ USD (เช่น 1 USD = 35 THB)
    const amountUsd = (parseFloat(amountThb) / 35).toFixed(2);
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amountUsd,
        price_currency: 'usd',
        pay_currency: payCurrency,
        order_id: `TOPUP_${userId || 'GUEST'}_${Date.now()}`,
        order_description: `OSX HUB Credit Topup - User ${userId}`,
        ipn_callback_url: `${origin}/api/pay/crypto/webhook`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Crypto checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการสร้างรายการคริปโต' },
      { status: 500 }
    );
  }
}
