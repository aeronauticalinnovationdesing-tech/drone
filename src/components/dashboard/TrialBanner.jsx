import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Clock, Crown, AlertTriangle, CheckCircle, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useCountdown(trialStartISO) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!trialStartISO) return;
    const trialEnd = new Date(trialStartISO).getTime() + 48 * 60 * 60 * 1000;

    const tick = () => {
      const diff = trialEnd - Date.now();
      if (diff <= 0) {
        setRemaining({ expired: true, h: 0, m: 0, s: 0 });
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining({ expired: false, h, m, s });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trialStartISO]);

  return remaining;
}

export default function TrialBanner({ profile }) {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const { data: subs = [] } = useQuery({
    queryKey: ["subscription", profile],
    queryFn: () => base44.entities.Subscription.filter({ profile }),
    enabled: !!profile,
  });

  const sub = subs[0] || null;
  const countdown = useCountdown(sub?.trial_start_date || null);

  const createSub = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription", profile] }),
  });

  const updateSub = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription", profile] }),
  });

  // Auto-create subscription record with trial start on first load (admin only)
  useEffect(() => {
    if (isAdmin && subs.length === 0 && profile) {
      createSub.mutate({
        profile,
        monthly_price_cop: 0,
        is_active: false,
        trial_start_date: new Date().toISOString(),
      });
    }
  }, [isAdmin, subs.length, profile]);

  const handleSavePrice = () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    if (sub) {
      updateSub.mutate({ id: sub.id, data: { monthly_price_cop: price } });
    }
    setEditingPrice(false);
  };

  if (!sub && !isAdmin) return null;

  const trialActive = sub?.trial_start_date && countdown && !countdown.expired;
  const trialExpired = sub?.trial_start_date && countdown?.expired;
  const isPaid = sub?.is_active;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={`rounded-2xl border p-5 ${
      isPaid
        ? "bg-emerald-500/5 border-emerald-500/20"
        : trialExpired
        ? "bg-destructive/5 border-destructive/30"
        : "bg-amber-500/5 border-amber-500/20"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status */}
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPaid ? "bg-emerald-500/15" : trialExpired ? "bg-destructive/15" : "bg-amber-500/15"
          }`}>
            {isPaid ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : trialExpired ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div>
            {isPaid && (
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Suscripción Activa</p>
            )}
            {!isPaid && trialActive && countdown && (
              <>
                <p className="font-semibold text-amber-600 dark:text-amber-400 text-sm">Prueba Gratuita</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tiempo restante:{" "}
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {pad(countdown.h)}h {pad(countdown.m)}m {pad(countdown.s)}s
                  </span>
                </p>
              </>
            )}
            {!isPaid && trialExpired && (
              <>
                <p className="font-semibold text-destructive text-sm">Prueba Vencida</p>
                <p className="text-xs text-muted-foreground mt-0.5">Activa tu suscripción para continuar</p>
              </>
            )}
            {!sub && isAdmin && (
              <p className="text-xs text-muted-foreground">Iniciando prueba gratuita...</p>
            )}
          </div>
        </div>

        {/* Price section */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Suscripción mensual</p>
            {editingPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">COP $</span>
                <Input
                  className="w-32 h-7 text-sm"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="0"
                  type="number"
                  autoFocus
                />
                <Button size="icon" className="h-7 w-7" onClick={handleSavePrice}>
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPrice(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">
                  {sub?.monthly_price_cop > 0
                    ? `COP $${Number(sub.monthly_price_cop).toLocaleString("es-CO")}`
                    : "Por definir"}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => { setPriceInput(sub?.monthly_price_cop || ""); setEditingPrice(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {isAdmin && sub && (
            <Button
              size="sm"
              variant={isPaid ? "outline" : "default"}
              className="gap-2 flex-shrink-0"
              onClick={() => updateSub.mutate({ id: sub.id, data: { is_active: !isPaid } })}
            >
              <Crown className="w-3.5 h-3.5" />
              {isPaid ? "Desactivar" : "Activar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}