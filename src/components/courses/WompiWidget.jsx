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
    // Cargar el script de Wompi solo una vez
    if (window.WidgetCheckout) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
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
  }, []);

  // Inicializar widget cuando tenemos todos los datos y el script está cargado
  useEffect(() => {
    if (scriptLoaded && reference && amountInCents && customerEmail && publicKey && signature) {
      initializeWidget();
    }
  }, [scriptLoaded, reference, amountInCents, customerEmail, publicKey, signature]);

  const initializeWidget = () => {
    if (!window.WidgetCheckout) return;

    const redirectUrl = `${window.location.origin}/Courses?wompi_ref=${reference}`;
    
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