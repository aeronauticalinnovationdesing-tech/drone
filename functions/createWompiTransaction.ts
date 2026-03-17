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
    
    // Construir URL con firma sin doble codificación
    const url = new URL('https://checkout.wompi.co/p/');
    url.searchParams.append('public-key', publicKey);
    url.searchParams.append('currency', currency);
    url.searchParams.append('amount-in-cents', parseInt(amountInCents).toString());
    url.searchParams.append('reference', reference);
    url.searchParams.append('redirect-url', redirectUrl);
    
    // Agregar signature:integrity al final sin codificación adicional
    const baseUrlStr = url.toString();
    const checkoutUrl = `${baseUrlStr}&signature:integrity=${signature}`;

    return Response.json({ 
      processingUrl: checkoutUrl
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});