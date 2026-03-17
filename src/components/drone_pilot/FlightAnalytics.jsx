import React, { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plane, Clock, Activity, AlertTriangle } from "lucide-react";

const COLORS = ["#0ea5e9", "#06b6d4", "#14b8a6", "#f59e0b"];

export function FlightHoursChart({ flights }) {
  const data = useMemo(() => {
    const daily = {};
    flights.forEach(f => {
      const day = new Date(f.date).toLocaleDateString("es-CO", { month: "short", day: "numeric" });
      if (!daily[day]) daily[day] = { hours: 0, flights: 0 };
      daily[day].hours += f.logged_hours || 0;
      daily[day].flights += 1;
    });
    return Object.entries(daily).map(([date, d]) => ({ date, ...d }));
  }, [flights]);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-lg mb-4">Horas de Vuelo por Día</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} />
          <Bar dataKey="hours" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlightTypeDistribution({ flights }) {
  const data = useMemo(() => {
    const types = {};
    flights.forEach(f => {
      const tag = f.tags?.[0] || "Sin etiqueta";
      types[tag] = (types[tag] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [flights]);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-lg mb-4">Distribución de Tipos de Vuelo</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#0ea5e9" dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlightMetrics({ flights, missions }) {
  const stats = useMemo(() => {
    const totalHours = flights.reduce((s, f) => s + (f.logged_hours || 0), 0);
    const completedFlights = flights.filter(f => f.status === "completed").length;
    const avgFlightDuration = flights.length > 0 ? (totalHours / flights.length).toFixed(2) : 0;
    const activeMissions = missions.filter(m => m.status === "active").length;
    const completedMissions = missions.filter(m => m.status === "completed").length;
    const missionProgress = missions.length > 0 ? ((completedMissions / missions.length) * 100).toFixed(0) : 0;

    return { totalHours: totalHours.toFixed(1), completedFlights, avgFlightDuration, activeMissions, completedMissions, missionProgress };
  }, [flights, missions]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-sky-500" />
          <span className="text-xs text-muted-foreground">Total Horas</span>
        </div>
        <p className="text-2xl font-bold text-sky-600">{stats.totalHours}h</p>
        <p className="text-xs text-muted-foreground mt-1">{stats.completedFlights} vuelos</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-4 h-4 text-cyan-500" />
          <span className="text-xs text-muted-foreground">Promedio/Vuelo</span>
        </div>
        <p className="text-2xl font-bold text-cyan-600">{stats.avgFlightDuration}h</p>
        <p className="text-xs text-muted-foreground mt-1">Duración media</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-teal-500" />
          <span className="text-xs text-muted-foreground">Misiones Activas</span>
        </div>
        <p className="text-2xl font-bold text-teal-600">{stats.activeMissions}</p>
        <p className="text-xs text-muted-foreground mt-1">De {stats.completedMissions} completadas</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-muted-foreground">Progreso Global</span>
        </div>
        <p className="text-2xl font-bold text-amber-600">{stats.missionProgress}%</p>
        <p className="text-xs text-muted-foreground mt-1">Misiones completadas</p>
      </div>
    </div>
  );
}

export function MaintenanceReminder({ flights }) {
  const lastMaintenance = useMemo(() => {
    if (flights.length === 0) return null;
    const sorted = [...flights].sort((a, b) => new Date(b.date) - new Date(a.date));
    const hours = sorted.reduce((s, f) => s + (f.logged_hours || 0), 0);
    return { hours, nextDue: Math.max(0, 50 - (hours % 50)) };
  }, [flights]);

  if (!lastMaintenance) return null;

  return (
    <div className={`rounded-2xl border p-5 ${lastMaintenance.nextDue < 5 ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/20"}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={lastMaintenance.nextDue < 5 ? "w-5 h-5 text-red-600" : "w-5 h-5 text-amber-600"} />
        <div>
          <p className={lastMaintenance.nextDue < 5 ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>
            {lastMaintenance.nextDue < 5 ? "⚠️ Mantenimiento requerido" : "📋 Próximo mantenimiento"}
          </p>
          <p className="text-sm text-muted-foreground">{lastMaintenance.nextDue}h restantes antes del siguiente servicio (cada 50h)</p>
        </div>
      </div>
    </div>
  );
}