import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Renueva automáticamente una suscripción usando el token de pago
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscriptionId } = await req.json();

    const sub = await base44.asServiceRole.entities.Subscription.filter({ id: subscriptionId });
    if (!sub || sub.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = sub[0];
    if (!subscription.payment_token || !subscription.auto_renew) {
      return Response.json({ error: 'Auto-renewal not enabled or no payment token' }, { status: 400 });
    }

    const isProduction = Deno.env.get('WOMPI_PUBLIC_KEY')?.startsWith('pub_prod_');
    const baseUrl = isProduction
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';

    const amountInCents = Math.round(subscription.monthly_price_cop * 100);
    const reference = `VEXNY-RENEWAL-${subscription.id}-${Date.now()}`;

    // Usar el token guardado para procesar el pago
    const paymentRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('WOMPI_PRIVATE_KEY')}`,
      },
      body: JSON.stringify({
        amount_in_cents: amountInCents,
        currency: 'COP',
        reference,
        customer_email: subscription.created_by,
        payment_source_id: subscription.payment_token,
      }),
    });

    const paymentData = await paymentRes.json();

    if (paymentData?.data?.status === 'APPROVED') {
      const now = new Date();
      const paidUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await base44.asServiceRole.entities.Subscription.update(subscription.id, {
        paid_until: paidUntil.toISOString(),
        last_renewal_date: now.toISOString(),
      });

      return Response.json({ success: true, status: 'APPROVED' });
    }

    return Response.json({ success: false, status: paymentData?.data?.status || 'FAILED' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});