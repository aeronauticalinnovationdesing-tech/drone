import React, { useEffect, useState } from 'react';

export default function WompiWidget({ 
  reference, 
  amountInCents, 
  customerEmail,
  publicKey,
  signature
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Si el script ya está cargado
    if (window.WidgetCheckout) {
      setScriptLoaded(true);
      initializeWidget();
      return;
    }

    // Cargar el script de Wompi
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      initializeWidget();
    };
    script.onerror = () => {
      console.error('Failed to load Wompi widget script');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [reference, amountInCents, customerEmail, publicKey, signature]);

  const initializeWidget = () => {
    if (!window.WidgetCheckout) return;

    const redirectUrl = `${window.location.origin}/Courses?wompi_ref=${reference}`;
    
    console.log('🔧 Wompi Widget Init:', { 
      reference, 
      amountInCents, 
      customerEmail,
      publicKey,
      redirectUrl
    });
    
    try {
      const checkout = new window.WidgetCheckout({
        currency: 'COP',
        amountInCents: String(amountInCents),
        reference: String(reference),
        publicKey: String(publicKey),
        customerEmail: String(customerEmail),
        redirectUrl: String(redirectUrl),
        signature: String(signature)
      });

      checkout.on('payment:success', (data) => {
        console.log('✓ Payment successful:', data);
      });

      checkout.on('payment:error', (error) => {
        console.error('✗ Payment error:', error);
      });

      console.log('📱 Rendering Wompi widget...');
      checkout.render('#wompi-checkout');
    } catch (error) {
      console.error('Widget initialization error:', error);
    }
  };

  if (!scriptLoaded) {
    return <div className="text-center py-4 text-muted-foreground">Cargando widget de pago...</div>;
  }

  return <div id="wompi-checkout" />;
}