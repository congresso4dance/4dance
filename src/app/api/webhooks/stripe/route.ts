import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import PurchaseEmail from '@/components/emails/PurchaseEmail';
import { trackActivityInternal } from '@/app/actions/crm-actions';

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27-acacia' as any,
    });
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
  const stripe = getStripe();
  const resend = getResend();
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
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
      if (eventId) {
        try {
          const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

          if (event) {
            const amountTotal = session.amount_total || 0;
            const photographerCut = Math.floor(amountTotal * (event.commission_photographer / 100));
            const producerCut = Math.floor(amountTotal * (event.commission_producer / 100));
            const platformCut = amountTotal - photographerCut - producerCut;

            let photographerTransferId = null;
            let producerTransferId = null;

            // Photographer Transfer
            if (event.photographer_id) {
              const { data: photoProfile } = await supabase
                .from('profiles')
                .select('stripe_account_id')
                .eq('id', event.photographer_id)
                .single();

              if (photoProfile?.stripe_account_id) {
                const transfer = await stripe.transfers.create({
                  amount: photographerCut,
                  currency: 'brl',
                  destination: photoProfile.stripe_account_id,
                  description: `Venda fotos Evento ${event.name}`,
                  metadata: { orderId, eventId }
                });
                photographerTransferId = transfer.id;
              }
            }

            // Producer Transfer
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
                  description: `Comissão Produtor Evento ${event.name}`,
                  metadata: { orderId, eventId }
                });
                producerTransferId = transfer.id;
              }
            }

            // Record in revenue_splits
            await supabase
              .from('revenue_splits')
              .insert({
                order_id: orderId,
                event_id: eventId,
                total_amount: amountTotal / 100,
                photographer_id: event.photographer_id,
                photographer_amount: photographerCut / 100,
                producer_id: event.producer_id,
                producer_amount: producerCut / 100,
                platform_amount: platformCut / 100,
                status: (photographerTransferId || producerTransferId) ? 'paid' : 'pending'
              });
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
