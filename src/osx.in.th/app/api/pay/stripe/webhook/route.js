import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const isStripeEnabled = process.env.ENABLE_STRIPE === 'true';
    if (!isStripeEnabled || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ message: 'Stripe webhook is currently disabled' }, { status: 200 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // เมื่อตัดบัตรหรือชำระเงินสำเร็จ
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, amount } = session.metadata || {};

      console.log(`[Stripe Webhook] Payment Successful! User: ${userId}, Amount: ${amount} THB`);

      // บันทึกเติมเงินเข้าฐานข้อมูล
      // ตัวอย่าง: สามารถเรียก internal API หรือ database query ได้ที่นี่
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
