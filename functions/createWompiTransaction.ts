import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reference, amountInCents, currency, customerEmail, redirectUrl, signature } = await req.json();

    const privateKey = Deno.env.get('WOMPI_PRIVATE_KEY');
    if (!privateKey) {
      return Response.json({ error: 'Missing WOMPI_PRIVATE_KEY' }, { status: 500 });
    }

    const publicKey = Deno.env.get('WOMPI_PUBLIC_KEY');
    
    // Construir URL como en versión anterior que funcionaba
    const wompiCheckoutUrl = new URL('https://checkout.wompi.co/p');
    wompiCheckoutUrl.searchParams.set('public-key', publicKey);
    wompiCheckoutUrl.searchParams.set('currency', currency);
    wompiCheckoutUrl.searchParams.set('amount-in-cents', amountInCents.toString());
    wompiCheckoutUrl.searchParams.set('reference', reference);
    wompiCheckoutUrl.searchParams.set('customer-email', customerEmail);
    wompiCheckoutUrl.searchParams.set('redirect-url', redirectUrl);
    wompiCheckoutUrl.searchParams.set('signature:integrity', signature);
    
    const checkoutUrl = wompiCheckoutUrl.toString();

    return Response.json({ 
      processingUrl: checkoutUrl
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});