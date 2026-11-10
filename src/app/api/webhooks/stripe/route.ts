import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import PurchaseEmail from '@/components/emails/PurchaseEmail';
import { trackActivityInternal } from '@/utils/crm-internal';

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

let resendInstance: Resend | null = null;
function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY!);
  }
  return resendInstance;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado');
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

  const stripe = getStripe();
  const resend = getResend();
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle Event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Pedido de VÍDEO (piloto): fluxo separado e mais simples do que o de
    // fotos — um vídeo só tem um fotógrafo responsável, então não precisa
    // agrupar por fotógrafo como acontece com o carrinho de fotos.
    if (session.metadata?.type === 'video') {
      const videoOrderId = session.metadata?.videoOrderId;
      const eventId = session.metadata?.eventId;
      const videoId = session.metadata?.videoId;

      if (videoOrderId) {
        await supabase.from('video_orders').update({ status: 'paid' }).eq('id', videoOrderId);

        try {
          const amountTotal = session.amount_total || 0;

          const { data: video } = await supabase
            .from('videos')
            .select('photographer_id')
            .eq('id', videoId)
            .single();

          const { data: eventRow } = eventId
            ? await supabase.from('events').select('*').eq('id', eventId).single()
            : { data: null };

          const responsibleId = video?.photographer_id || eventRow?.photographer_id;

          if (eventRow && responsibleId) {
            const photographerCut = Math.floor(amountTotal * ((eventRow.commission_photographer ?? 70) / 100));

            const { data: photographerProfile } = await supabase
              .from('profiles')
              .select('stripe_account_id')
              .eq('id', responsibleId)
              .single();

            let transferId: string | null = null;
            if (photographerProfile?.stripe_account_id && photographerCut > 0) {
              const transfer = await stripe.transfers.create({
                amount: photographerCut,
                currency: 'brl',
                destination: photographerProfile.stripe_account_id,
                description: `Venda de vídeo - ${eventRow.name || eventRow.title}`,
                metadata: { videoOrderId, eventId: eventId || '', photographerId: responsibleId },
              });
              transferId = transfer.id;
            }

            await supabase.from('revenue_splits').insert({
              order_id: videoOrderId,
              event_id: eventId,
              total_amount: amountTotal / 100,
              photographer_id: responsibleId,
              photographer_amount: photographerCut / 100,
              producer_id: null,
              producer_amount: 0,
              platform_amount: (amountTotal - photographerCut) / 100,
              status: transferId ? 'paid' : 'pending',
            });
          }
        } catch (splitErr) {
          console.error('❌ Erro no split de vídeo:', splitErr);
        }

        const customerEmail = session.customer_details?.email;
        if (customerEmail) {
          await trackActivityInternal(customerEmail, 'PURCHASE', undefined, {
            video_order_id: videoOrderId,
            amount: (session.amount_total || 0) / 100,
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    const orderId = session.metadata?.orderId;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Bailarino(a)';
    const amount = (session.amount_total || 0) / 100;

    if (orderId) {
      console.log(`✅ Pagamento confirmado para o pedido: ${orderId}`);
      
      const eventId = session.metadata?.eventId;
      
      // 1. Update Order Status
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      // 2. Calculate and execute REVENUE SPLIT
      // Um evento pode ter vários fotógrafos vinculados (dono + colaboradores
      // que entraram via Oportunidades). Cada um ganha commission_photographer%
      // só sobre as fotos que ELE MESMO tirou (photos.photographer_id) — não é
      // uma divisão do pedido inteiro. Fotos sem photographer_id definido (ex:
      // upload antigo do admin sem atribuição) caem no dono original do evento
      // (event.photographer_id), pra não deixar ninguém sem receber.
      if (eventId) {
        try {
          const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

          const { data: order } = await supabase
            .from('orders')
            .select('items')
            .eq('id', orderId)
            .single();

          const photoIds: string[] = order?.items || [];

          if (event && photoIds.length > 0) {
            const amountTotal = session.amount_total || 0;
            const perPhotoAmount = Math.floor(amountTotal / photoIds.length);

            const { data: photosSold } = await supabase
              .from('photos')
              .select('id, photographer_id')
              .in('id', photoIds);

            // Agrupa as fotos vendidas por fotógrafo responsável
            const byPhotographer = new Map<string, number>();
            for (const photoId of photoIds) {
              const photo = photosSold?.find(p => p.id === photoId);
              const responsibleId = photo?.photographer_id || event.photographer_id;
              if (!responsibleId) continue;
              byPhotographer.set(responsibleId, (byPhotographer.get(responsibleId) || 0) + perPhotoAmount);
            }

            let totalPhotographerCut = 0;
            const splitRows: any[] = [];

            for (const [photographerId, groupAmount] of byPhotographer.entries()) {
              const photographerCut = Math.floor(groupAmount * (event.commission_photographer / 100));
              totalPhotographerCut += photographerCut;

              const { data: photoProfile } = await supabase
                .from('profiles')
                .select('stripe_account_id')
                .eq('id', photographerId)
                .single();

              let transferId: string | null = null;
              if (photoProfile?.stripe_account_id && photographerCut > 0) {
                const transfer = await stripe.transfers.create({
                  amount: photographerCut,
                  currency: 'brl',
                  destination: photoProfile.stripe_account_id,
                  description: `Venda fotos Evento ${event.name || event.title}`,
                  metadata: { orderId, eventId, photographerId }
                });
                transferId = transfer.id;
              }

              splitRows.push({
                order_id: orderId,
                event_id: eventId,
                total_amount: groupAmount / 100,
                photographer_id: photographerId,
                photographer_amount: photographerCut / 100,
                producer_id: null,
                producer_amount: 0,
                platform_amount: 0,
                status: transferId ? 'paid' : 'pending'
              });
            }

            // Comissão do produtor e da plataforma continuam calculadas sobre
            // o pedido inteiro, e ficam registradas numa linha própria (sem
            // photographer_id) pra não duplicar total_amount/producer_amount
            // quando o pedido tem mais de um fotógrafo envolvido.
            const producerCut = Math.floor(amountTotal * (event.commission_producer / 100));
            const platformCut = amountTotal - totalPhotographerCut - producerCut;

            let producerTransferId: string | null = null;
            if (event.producer_id && producerCut > 0) {
              const { data: prodProfile } = await supabase
                .from('profiles')
                .select('stripe_account_id')
                .eq('id', event.producer_id)
                .single();

              if (prodProfile?.stripe_account_id) {
                const transfer = await stripe.transfers.create({
                  amount: producerCut,
                  currency: 'brl',
                  destination: prodProfile.stripe_account_id,
                  description: `Comissão Produtor Evento ${event.name || event.title}`,
                  metadata: { orderId, eventId }
                });
                producerTransferId = transfer.id;
              }
            }

            splitRows.push({
              order_id: orderId,
              event_id: eventId,
              total_amount: amountTotal / 100,
              photographer_id: null,
              photographer_amount: 0,
              producer_id: event.producer_id,
              producer_amount: producerCut / 100,
              platform_amount: platformCut / 100,
              status: (producerTransferId || platformCut >= 0) ? 'paid' : 'pending'
            });

            await supabase.from('revenue_splits').insert(splitRows);
          }
        } catch (splitErr) {
          console.error('❌ Erro no Revenue Split:', splitErr);
        }
      }

      // CRM Tracking: Log purchase
      if (customerEmail) {
        await trackActivityInternal(customerEmail, 'PURCHASE', undefined, { 
          order_id: orderId,
          amount: amount
        });
      }

      // Enviar de E-mail de Confirmação
      if (customerEmail && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: '4Dance <contato@4dance.com.br>', 
            to: customerEmail,
            subject: 'Suas fotos estão prontas! 📸 | 4Dance',
            react: PurchaseEmail({ customerName, orderId, amount }),
          });
          console.log(`✅ E-mail enviado para: ${customerEmail}`);
        } catch (emailError) {
          console.error('Erro ao enviar e-mail:', emailError);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
