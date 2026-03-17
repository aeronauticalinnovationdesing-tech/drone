import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reference, amountInCents, currency } = await req.json();

    const integritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET');

    if (!integritySecret) {
      return Response.json({ error: 'Missing WOMPI_INTEGRITY_SECRET' }, { status: 500 });
    }

    // Validar y normalizar amountInCents
    const amount = typeof amountInCents === 'string' ? parseInt(amountInCents) : Math.round(amountInCents);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'amountInCents must be a valid positive integer' }, { status: 400 });
    }

    // Fórmula exacta según Wompi: concatenar sin separadores
    const dataToSign = `${reference}${amount}${currency}${integritySecret}`;

    // Debug completo
    console.log('🔍 WOMPI SIGNATURE GENERATION:');
    console.log('  Input - reference:', reference);
    console.log('  Input - amountInCents:', amountInCents, '(type:', typeof amountInCents, ')');
    console.log('  Parsed amount:', amount);
    console.log('  Currency:', currency);
    console.log('  IntegritySecret exists:', !!integritySecret);
    console.log('  Data to sign:', dataToSign);

    const encoded = new TextEncoder().encode(dataToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('  ✓ Generated signature:', signature);
    console.log('  ✓ Signature length:', signature.length);

    const publicKey = Deno.env.get('WOMPI_PUBLIC_KEY');
    return Response.json({ signature, publicKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});