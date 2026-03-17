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
    
    // Construir URL con los parámetros correctos
    const params = new URLSearchParams({
      'public-key': publicKey,
      'currency': currency,
      'amount-in-cents': parseInt(amountInCents).toString(),
      'reference': reference,
      'redirect-url': redirectUrl,
    });
    
    // Agregar signature:integrity manualmente para preservar los dos puntos
    const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}&signature:integrity=${encodeURIComponent(signature)}`;

    return Response.json({ 
      processingUrl: checkoutUrl
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});