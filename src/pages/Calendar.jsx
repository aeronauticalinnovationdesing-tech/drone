import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const typeLabels = { meeting: "Reunión", deadline: "Fecha límite", reminder: "Recordatorio", personal: "Personal", other: "Otro" };
const typeColors = { meeting: "bg-blue-500", deadline: "bg-red-500", reminder: "bg-primary", personal: "bg-purple-500", other: "bg-muted-foreground" };

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", type: "reminder" });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => base44.entities.CalendarEvent.list("-date") });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });

  const createEvent = useMutation({ mutationFn: (d) => base44.entities.CalendarEvent.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setShowForm(false); } });
  const deleteEvent = useMutation({ mutationFn: (id) => base44.entities.CalendarEvent.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }) });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const dayEvents = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (e.date) {
        const key = e.date;
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    tasks.forEach(t => {
      if (t.due_date && t.status !== "completed") {
        const key = t.due_date;
        if (!map[key]) map[key] = [];
        map[key].push({ ...t, type: "deadline", title: `📋 ${t.title}` });
      }
    });
    return map;
  }, [events, tasks]);

  const selectedEvents = selectedDate ? (dayEvents[format(selectedDate, "yyyy-MM-dd")] || []) : [];

  const openNewEvent = (date) => {
    setForm({ title: "", description: "", date: format(date, "yyyy-MM-dd"), time: "", type: "reminder" });
    setShowForm(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        </div>
        <Button onClick={() => openNewEvent(new Date())} className="gap-2"><Plus className="w-4 h-4" /> Nuevo Evento</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <h2 className="text-lg font-semibold capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvts = dayEvents[dateKey] || [];
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square p-1 rounded-xl text-sm transition-all flex flex-col items-center justify-start gap-0.5",
                    isToday && "bg-primary/10 font-bold",
                    isSelected && "ring-2 ring-primary",
                    "hover:bg-muted"
                  )}
                >
                  <span className={cn("text-xs", isToday && "text-primary")}>{format(day, "d")}</span>
                  {dayEvts.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayEvts.slice(0, 3).map((e, i) => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", typeColors[e.type] || "bg-muted-foreground")} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">
            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : "Selecciona un día"}
          </h3>
          <div className="space-y-2">
            {selectedEvents.map((evt, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/50 group flex items-start gap-2">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", typeColors[evt.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{evt.title}</p>
                  {evt.time && <p className="text-xs text-muted-foreground">{evt.time}</p>}
                </div>
                {evt.id && !evt.due_date && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteEvent.mutate(evt.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            {selectedDate && selectedEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin eventos</p>
            )}
            {selectedDate && (
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openNewEvent(selectedDate)}>
                <Plus className="w-3 h-3 mr-1" /> Agregar evento
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createEvent.mutate(form); }} className="space-y-4">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
              <div><Label>Hora</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}