import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bot, Send, Loader2, Sword, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

export default function Secretary() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list("-created_date") });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => base44.entities.CalendarEvent.list("-date", 20) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list("-created_date", 20) });

  const buildContext = () => {
    const pendingTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
    const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
    const todayEvents = events.filter(e => e.date === format(new Date(), "yyyy-MM-dd"));
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

    return `
CONTEXTO ACTUAL DEL USUARIO (Fecha: ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}):
- Proyectos: ${projects.length} total, ${projects.filter(p => p.status === "active").length} activos
- Tareas pendientes: ${pendingTasks.length}, vencidas: ${overdueTasks.length}
- Eventos hoy: ${todayEvents.length} (${todayEvents.map(e => e.title).join(", ") || "ninguno"})
- Balance financiero: $${(totalIncome - totalExpense).toLocaleString()} (Ingresos: $${totalIncome.toLocaleString()}, Gastos: $${totalExpense.toLocaleString()})
- Tareas vencidas: ${overdueTasks.map(t => `"${t.title}" (venció ${t.due_date})`).join(", ") || "ninguna"}
- Tareas de hoy: ${pendingTasks.filter(t => t.due_date === format(new Date(), "yyyy-MM-dd")).map(t => t.title).join(", ") || "ninguna"}
`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const context = buildContext();
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres la Secretaria Virtual de VEXNY, una asistente ejecutiva con mentalidad de gladiador. Eres directa, eficiente y motivadora. Hablas en español.

${context}

El usuario dice: "${input}"

Responde de forma útil, concisa y con energía de guerrero. Si el usuario pide un resumen, dale un reporte claro. Si pregunta sobre sus tareas, proyectos o finanzas, usa los datos del contexto. Motívalo a conquistar el día.`,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  // Alerts
  const overdueTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date());
  const todayTasks = tasks.filter(t => t.status !== "completed" && t.due_date === format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center gap-3">
        <Bot className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Secretaria Virtual</h1>
      </div>

      {/* Alerts */}
      {(overdueTasks.length > 0 || todayTasks.length > 0) && (
        <div className="space-y-2">
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{overdueTasks.length} tarea(s) vencida(s) requieren tu atención</span>
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{todayTasks.length} tarea(s) para hoy: {todayTasks.map(t => t.title).join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sword className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">¡Gladiador, estoy a tu servicio!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Pregúntame sobre tus tareas, proyectos, finanzas o pídeme un resumen del día. Estoy aquí para que conquistes.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {["¿Cómo va mi día?", "Dame un resumen", "¿Qué tareas tengo pendientes?", "¿Cómo van mis finanzas?"].map(q => (
                  <Button key={q} variant="outline" size="sm" onClick={() => { setInput(q); }} className="text-xs">
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}