import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import PurchaseEmail from '@/components/emails/PurchaseEmail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27-acacia' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  const supabase = await createClient();

  // Handle Event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Bailarino(a)';
    const amount = (session.amount_total || 0) / 100;

    if (orderId) {
      console.log(`✅ Pagamento confirmado para o pedido: ${orderId}`);
      
      // Update Order Status
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (error) {
        console.error('Erro ao atualizar pedido:', error);
      }

      // Enviar de E-mail de Confirmação via Resend
      if (customerEmail && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: '4Dance <contato@4dance.com.br>', // Altere para seu domínio verificado
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
