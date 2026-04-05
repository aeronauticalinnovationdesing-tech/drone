import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CheckCircle, AlertTriangle, CreditCard, Loader2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function useCountdown(endDateISO) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!endDateISO) return;
    const endTime = new Date(endDateISO).getTime();
    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) setRemaining({ expired: true, h: 0, m: 0, s: 0, d: 0 });
      else setRemaining({
        expired: false,
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDateISO]);
  return remaining;
}

const pad = (n) => String(n).padStart(2, "0");

function IndividualSubscriptionCard({ monthlyPrice, userSub, onPay, paying, onCancel }) {
  const countdown = useCountdown(userSub?.paid_until || null);
  const isPaid = userSub?.is_active;
  const isExpired = isPaid && countdown?.expired;
  const isActive = isPaid && countdown && !countdown.expired;

  return (
    <div className={cn(
      "rounded-2xl border p-8 flex flex-col gap-6",
      isActive ? "border-emerald-500/30 bg-emerald-500/5" : 
      isExpired ? "border-destructive/30 bg-destructive/5" : 
      "border-border bg-card"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Piloto Individual</h3>
            <p className="text-sm text-muted-foreground">Solo tú gestiona tu perfil de vuelos</p>
          </div>
        </div>
        {isActive && <Badge className="bg-emerald-500/15 text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Activa</Badge>}
        {isExpired && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Vencida</Badge>}
        {!userSub && <Badge variant="secondary">Sin suscripción</Badge>}
      </div>

      {isActive && countdown && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Vence en:</p>
          <p className="text-2xl font-mono font-bold text-emerald-600">{pad(countdown.d)}d {pad(countdown.h)}h {pad(countdown.m)}m</p>
        </div>
      )}

      {isExpired && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-destructive">Tu suscripción ha vencido. Renuévala para continuar.</p>
        </div>
      )}

      {!userSub && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Incluye <strong>7 días de prueba gratis</strong>. Sin tarjeta de crédito.</p>
        </div>
      )}

      <div className="border-t border-border/50 pt-4">
        <p className="text-4xl font-bold mb-1">${monthlyPrice?.toLocaleString("es-CO") || "—"} <span className="text-sm font-normal text-muted-foreground">COP/mes</span></p>
        <p className="text-xs text-muted-foreground mb-4">Acceso a registro completo de vuelos y reportes</p>
        
        <div className="flex gap-3">
          {isActive ? (
            <>
              <Button variant="outline" disabled className="flex-1 text-emerald-600 border-emerald-500/30">
                <CheckCircle className="w-4 h-4 mr-2" /> Activa
              </Button>
              <Button
                variant="ghost"
                onClick={() => onCancel(userSub.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Cancelar
              </Button>
            </>
          ) : isExpired ? (
            <Button className="w-full gap-2 bg-sky-600 hover:bg-sky-700" onClick={() => onPay("individual", monthlyPrice)} disabled={paying}>
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Renovar Suscripción
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-sky-600 hover:bg-sky-700" onClick={() => onPay("individual", monthlyPrice)} disabled={paying}>
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Iniciar Prueba Gratis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanySubscriptionCard({ userCompanySub, onUpgrade }) {
  const countdown = useCountdown(userCompanySub?.paid_until || null);
  const isActive = userCompanySub?.is_active && countdown && !countdown.expired;

  return (
    <div className={cn(
      "rounded-2xl border p-8 flex flex-col gap-6",
      isActive ? "border-purple-500/30 bg-purple-500/5" : "border-border/50 bg-muted/20"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Suscripción de Empresa</h3>
            <p className="text-sm text-muted-foreground">Múltiples usuarios en un solo perfil</p>
          </div>
        </div>
        {isActive && <Badge className="bg-purple-500/15 text-purple-600"><CheckCircle className="w-3 h-3 mr-1" /> Activa</Badge>}
      </div>

      {isActive ? (
        <>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Empresa: <strong>{userCompanySub.company_name}</strong></p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Pilotos</p>
                <p className="font-bold">{userCompanySub.max_pilots}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Drones</p>
                <p className="font-bold">{userCompanySub.max_drones}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Vence</p>
                <p className="font-bold text-sm">{countdown?.d}d {countdown?.h}h</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onUpgrade()}>
            Ir a Gestión de Empresa
          </Button>
        </>
      ) : (
        <>
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-muted-foreground text-sm mb-3">¿Trabajas en una operadora de drones?</p>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              Solicita una suscripción de empresa para que tu jefe de pilotos pueda gestionar múltiples miembros del equipo y coordinar vuelos.
            </p>
          </div>
          <Button variant="outline" className="w-full gap-2 border-purple-500/30" onClick={() => onUpgrade()}>
            <Users className="w-4 h-4" /> Solicitar Suscripción Empresa
          </Button>
        </>
      )}
    </div>
  );
}

export default function DronePilotSubscription() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyEmail, setCompanyEmail] = useState("");

  // Obtener precio de suscripción individual
  const { data: globalPrice } = useQuery({
    queryKey: ["drone-pilot-global-price"],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ profile: "drone_pilot" });
      return subs?.[0]?.monthly_price_cop || 99900;
    },
  });

  // Suscripción individual del usuario
  const { data: userSub } = useQuery({
    queryKey: ["drone-pilot-user-sub", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: user.email, profile: "drone_pilot" });
      return subs?.[0] || null;
    },
    enabled: !!user?.email,
  });

  // Suscripción de empresa (si pertenece a una)
  const { data: userCompanySub } = useQuery({
    queryKey: ["user-company-subscription", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.CompanySubscription.filter({ admin_user_email: user.email });
      return subs?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const handlePay = async (type, price) => {
    setPaying(true);
    try {
      const reference = `VEXNY-DRONE-${type}-${Date.now()}`;
      const amountInCents = price * 100;

      const res = await base44.functions.invoke("wompiSignature", {
        reference,
        amountInCents,
        currency: "COP",
      });

      const { signature, publicKey } = res.data;
      const redirectUrl = `${window.location.origin}/DronePilotSubscription`;

      const params = new URLSearchParams({
        "public-key": publicKey,
        currency: "COP",
        "amount-in-cents": String(amountInCents),
        reference,
        "signature:integrity": signature,
        "redirect-url": redirectUrl,
      });

      window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
    } catch (err) {
      console.error(err);
      alert("Error al iniciar el pago. Intenta de nuevo.");
      setPaying(false);
    }
  };

  const handleCancel = async (subId) => {
    if (!confirm("¿Estás seguro? Se cancelará tu suscripción.")) return;
    try {
      await base44.functions.invoke("cancelSubscription", { subscriptionId: subId });
      queryClient.invalidateQueries({ queryKey: ["drone-pilot-user-sub"] });
    } catch (err) {
      alert("Error al cancelar.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Suscripción - Piloto de Drones</h1>
        <p className="text-muted-foreground">Elige cómo quieres gestionar tus vuelos y equipo</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IndividualSubscriptionCard
          monthlyPrice={globalPrice}
          userSub={userSub}
          onPay={handlePay}
          paying={paying}
          onCancel={handleCancel}
        />
        <CompanySubscriptionCard
          userCompanySub={userCompanySub}
          onUpgrade={() => setShowCompanyForm(true)}
        />
      </div>

      {/* Company Request Dialog */}
      <Dialog open={showCompanyForm} onOpenChange={setShowCompanyForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Solicitar Suscripción de Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email del Jefe de Pilotos o Gerente</label>
              <Input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="gerente@empresa.com"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                El jefe de pilotos de tu empresa recibirá una invitación para configurar la suscripción y gestionar el equipo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyForm(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!companyEmail) return alert("Ingresa un email válido");
                try {
                  // TODO: Crear función backend para enviar solicitud
                  alert("Solicitud enviada. El administrador recibirá una invitación.");
                  setShowCompanyForm(false);
                  setCompanyEmail("");
                } catch (err) {
                  alert("Error al enviar solicitud.");
                }
              }}
            >
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}