import React, { useState } from "react";
import { Map, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const WEATHER_CONDITIONS = ["Despejado", "Parcialmente nublado", "Nublado", "Lluvia leve", "Lluvia fuerte", "Viento fuerte"];
const DRONE_TYPES = ["DJI Phantom 4", "DJI Air 2S", "DJI Mini 3 Pro", "Auterion Skynode", "Otro"];

export default function MissionPlanner({ missions, onPlanMission }) {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    weather: "Despejado",
    drone: "DJI Air 2S",
    plannedHours: "1",
    location: "",
  });

  const handlePlan = () => {
    if (!form.name || !form.location) return;
    onPlanMission?.({
      ...form,
      plannedHours: Number(form.plannedHours),
      createdAt: new Date(),
    });
    setForm({ name: "", weather: "Despejado", drone: "DJI Air 2S", plannedHours: "1", location: "" });
    setShowDialog(false);
  };

  const activeMissions = missions.filter(m => m.status === "active").length;
  const completedMissions = missions.filter(m => m.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-sky-500" />
            <h3 className="font-semibold text-lg">Planificación de Misiones</h3>
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Planificar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Misiones Activas</p>
            <p className="text-2xl font-bold text-sky-600">{activeMissions}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Completadas</p>
            <p className="text-2xl font-bold text-emerald-600">{completedMissions}</p>
          </div>
        </div>

        {missions.filter(m => m.status === "active").length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Sin misiones activas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missions.filter(m => m.status === "active").slice(0, 3).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description?.substring(0, 40)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Planificar Nueva Misión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre de la Misión</label>
              <Input placeholder="Ej: Inspección de terreno" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Ubicación</label>
              <Input placeholder="Ej: Bogotá, Sector Centro" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Condición Climática</label>
                <Select value={form.weather} onValueChange={v => setForm({ ...form, weather: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_CONDITIONS.map(w => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Drone</label>
                <Select value={form.drone} onValueChange={v => setForm({ ...form, drone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DRONE_TYPES.map(d => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Duración Estimada (horas)</label>
              <Input type="number" min="0.5" step="0.5" value={form.plannedHours} onChange={e => setForm({ ...form, plannedHours: e.target.value })} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePlan}>Crear Misión</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}