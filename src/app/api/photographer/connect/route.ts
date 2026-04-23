import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27-acacia' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Get or Create Stripe Connect Account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', // Express is easier for photographers
        country: 'BR',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: user.id,
        },
      });
      accountId = account.id;

      // Save the account ID to the profile
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    // 2. Create Account Link for Onboarding
    const origin = req.headers.get('origin');
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/portal-fotografo/configuracoes?refresh=true`,
      return_url: `${origin}/portal-fotografo/configuracoes?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('Stripe Connect Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
