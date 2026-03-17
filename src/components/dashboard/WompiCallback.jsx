import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/lib/ProfileContext';
import { Loader2 } from 'lucide-react';

export default function WompiCallback({ children }) {
  const { activeProfileId } = useProfile();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyTransaction = async () => {
      const params = new URLSearchParams(window.location.search);
      const transactionId = params.get('id');

      if (!transactionId) {
        setVerified(true);
        return;
      }

      try {
        // Verificar la transacción
        const res = await base44.functions.invoke('verifyWompiSubscription', {
          transactionId,
          profile: activeProfileId,
        });

        if (res.data.status === 'APPROVED') {
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setVerified(true);
      } catch (err) {
        console.error('Error verifying transaction:', err);
        setError(err.message);
        setVerified(true);
      }
    };

    if (activeProfileId) {
      verifyTransaction();
    }
  }, [activeProfileId]);

  if (!verified) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm px-4">
          <p className="text-sm text-destructive font-medium">Error al verificar pago</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return children;
}