import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit, getClientIp } from '@/utils/rate-limit';
import { VIDEO_PRICE_BRL } from '@/utils/pricing';

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimit(`checkout-video:${ip}`, 5, 60_000);
    if (!success) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 });
    }

    const stripe = getStripe();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { videoId } = await req.json();
    if (!videoId) {
      return NextResponse.json({ error: 'Vídeo não informado' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: video } = await supabaseAdmin
      .from('videos')
      .select('id, event_id, events(slug, title)')
      .eq('id', videoId)
      .single();

    if (!video) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    // Já comprou? Não deixa pagar de novo.
    const { data: existing } = await supabaseAdmin
      .from('video_orders')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Você já comprou este vídeo' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('video_orders')
      .insert({
        user_id: user.id,
        video_id: videoId,
        event_id: video.event_id,
        status: 'pending',
        amount: VIDEO_PRICE_BRL,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const eventInfo = video.events as unknown as { slug?: string; title?: string } | null;
    const origin = req.headers.get('origin');
    const returnPath = eventInfo?.slug ? `/eventos/${eventInfo.slug}` : '/eventos';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Vídeo 4Dance - ${eventInfo?.title || 'Evento'}`,
          },
          unit_amount: Math.round(VIDEO_PRICE_BRL * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}${returnPath}?video_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnPath}?video_canceled=true`,
      metadata: {
        type: 'video',
        videoOrderId: order.id,
        videoId,
        userId: user.id,
        eventId: video.event_id,
      },
    });

    await supabaseAdmin
      .from('video_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe Video Order Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
