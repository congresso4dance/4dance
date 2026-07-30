import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateUnitPrice } from '@/utils/pricing';
import { rateLimit, getClientIp } from '@/utils/rate-limit';

let stripeInstance: Stripe | null = null;

function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const { success } = rateLimit(`checkout:${ip}`, 5, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
    }

    const stripe = getStripe();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { items, eventId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    const unitPrice = calculateUnitPrice(items.length);
    const finalAmount = items.length * unitPrice;

    // 1. Create Order in DB (Pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        items: items.map((i: any) => i.id),
        amount: finalAmount,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // O repasse pro fotógrafo/produtor/plataforma NÃO é feito aqui. Ele
    // acontece depois, no webhook (checkout.session.completed), que já lê
    // commission_photographer/commission_producer/commission_platform por
    // evento e agora agrupa por fotógrafo individual (várias fotos do mesmo
    // pedido podem ser de fotógrafos diferentes quando o evento tem mais de
    // um). Fazer o split aqui também (via transfer_data) duplicava o
    // pagamento pro fotógrafo — e usava um campo (commission_rate) que nem
    // existe mais na tabela events.

    // 2. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Foto 4Dance - ${item.id}`,
            images: [item.url],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/minhas-fotos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/eventos?canceled=true`,
      metadata: {
        orderId: order.id,
        userId: user.id,
        eventId: eventId,
      },
    });

    // 3. Update Order with Session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe Order Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
