import React, { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSIONS = [
  { name: "Tokio", zone: "Asia/Tokyo", emoji: "🇯🇵", open: 8, close: 15, offset: 9 },
  { name: "Londres", zone: "Europe/London", emoji: "🇬🇧", open: 8, close: 17, offset: 0 },
  { name: "Nueva York", zone: "America/New_York", emoji: "🇺🇸", open: 9, close: 17, offset: -5 },
];

function isMarketOpen(hour) {
  const [openH, closeH] = [SESSIONS[1].open, SESSIONS[1].close]; // Ref a Londres 8-17
  return hour >= openH && hour < closeH;
}

export default function TradingHours() {
  const [times, setTimes] = useState({});

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const newTimes = {};
      SESSIONS.forEach(s => {
        const time = new Intl.DateTimeFormat("es-CO", {
          timeZone: s.zone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now);
        newTimes[s.zone] = time;
      });
      setTimes(newTimes);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Sesiones de Trading</h3>
      </div>
      <div className="space-y-3">
        {SESSIONS.map((session) => {
          const time = times[session.zone] || "—:—";
          const [h, m] = time.split(":").map(Number);
          const isOpen = h >= session.open && h < session.close;
          return (
            <div key={session.zone} className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all",
              isOpen ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/40 border-border"
            )}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{session.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{session.name}</p>
                  <p className={cn("text-xs", isOpen ? "text-emerald-600 font-medium" : "text-muted-foreground")}>
                    {isOpen ? "🟢 Abierto" : "🔴 Cerrado"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono">{time}</p>
                <p className="text-xs text-muted-foreground">{session.open}:00-{session.close}:00</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        ⚠️ Horarios aproximados · Verifica condiciones de tu broker
      </p>
    </div>
  );
}