import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plane, Wind, Map, Calendar, Bot, BookOpen, ArrowRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import PriceManager from "@/components/dashboard/PriceManager";
import { TaskStatusChart } from "@/components/dashboard/DashboardCharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DronePilotDashboard() {
  const user = useCurrentUser();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events-today", user?.email],
    queryFn: () => base44.entities.CalendarEvent.filter({ created_by: user.email }, "-date", 5),
    enabled: !!user,
  });

  const totalFlights = tasks.length;
  const completedFlights = tasks.filter(t => t.status === "completed").length;
  const pendingFlights = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const activeMissions = projects.filter(p => p.status === "active").length;
  const totalHours = tasks.reduce((s, t) => s + (t.logged_hours || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Plane className="w-6 h-6 text-sky-500" />
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Centro de Vuelo</h1>
        </div>
        <p className="text-muted-foreground text-sm capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      <TrialBanner profile="drone_pilot" />
      <PriceManager />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wind} label="Vuelos Totales" value={totalFlights} subtitle="en bitácora" />
        <StatCard icon={CheckCircle} label="Completados" value={completedFlights} subtitle="vuelos exitosos" />
        <StatCard icon={Clock} label="Pendientes" value={pendingFlights} subtitle="en cola" />
        <StatCard icon={Map} label="Misiones Activas" value={activeMissions} subtitle={`${totalHours.toFixed(1)}h registradas`} />
      </div>

      {/* Charts + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskStatusChart tasks={tasks} />

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Próximos Eventos</h2>
            <Link to="/Calendar" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay eventos próximos.</p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 5).map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.date} {ev.time && `· ${ev.time}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent flights + quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Últimos Vuelos</h2>
            <Link to="/Tasks" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              Bitácora <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <AlertCircle className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.status} · {task.logged_hours || 0}h</p>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-muted-foreground text-sm">No hay vuelos registrados.</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Acceso Rápido</h2>
          <div className="space-y-2">
            {[
              { label: "Registrar Vuelo", path: "/Tasks", icon: Wind },
              { label: "Proyectos / Misiones", path: "/Projects", icon: Map },
              { label: "Calendario", path: "/Calendar", icon: Calendar },
              { label: "Informes", path: "/Reports", icon: Plane },
              { label: "Secretaria IA", path: "/Secretary", icon: Bot },
              { label: "Cursos", path: "/Courses", icon: BookOpen },
            ].map((action) => (
              <Link key={action.path + action.label} to={action.path}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <action.icon className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}