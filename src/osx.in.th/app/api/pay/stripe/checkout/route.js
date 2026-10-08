import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // ตรวจสอบสถานะการเปิด/ปิดระบบชำระเงิน Stripe
    const isStripeEnabled = process.env.ENABLE_STRIPE === 'true';
    if (!isStripeEnabled || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'ระบบชำระเงินผ่านบัตรเครดิต/เดบิต ปิดปรับปรุงชั่วคราว (Coming Soon)' },
        { status: 503 }
      );
    }

    const { amount, userId, username } = await req.json();

    if (!amount || parseFloat(amount) < 20) {
      return NextResponse.json(
        { error: 'ยอดชำระขั้นต่ำ 20 บาท' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `เติมเครดิต OSX HUB (${amount} บาท)`,
              description: `บัญชีผู้ใช้: ${username || 'สมาชิก'}`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/topup?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/topup?payment=stripe_cancel`,
      metadata: {
        userId: String(userId || ''),
        username: String(username || ''),
        amount: String(amount),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งชำระเงิน' },
      { status: 500 }
    );
  }
}
