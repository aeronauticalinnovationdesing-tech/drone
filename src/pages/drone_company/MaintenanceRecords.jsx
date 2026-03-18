import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useProfile } from "@/lib/ProfileContext";

export default function MaintenanceRecords() {
  const { activeProfile } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({
    drone_id: "",
    drone_serial: "",
    maintenance_type: "preventivo",
    date: format(new Date(), "yyyy-MM-dd"),
    next_scheduled: "",
    description: "",
    technician_name: "",
    hours_before: "",
    hours_after: "",
    parts_replaced: [],
    cost: "",
    status: "completado",
  });
  const queryClient = useQueryClient();

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user?.email) return null;
      const results = await base44.entities.Company.filter({ created_by: user.email });
      return results[0] || null;
    },
  });

  // Fetch maintenance logs
  const { data: logs = [] } = useQuery({
    queryKey: ["maintenance-logs", company?.id],
    queryFn: () => base44.entities.DroneMaintenanceLog.filter({ company_id: company.id }, "-date"),
    enabled: !!company?.id,
  });

  // Fetch drones
  const { data: drones = [] } = useQuery({
    queryKey: ["drones", company?.id],
    queryFn: () => base44.entities.Drone.filter({ company_id: company.id }),
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DroneMaintenanceLog.create({ ...data, company_id: company.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DroneMaintenanceLog.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DroneMaintenanceLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({
      drone_id: "",
      drone_serial: "",
      maintenance_type: "preventivo",
      date: format(new Date(), "yyyy-MM-dd"),
      next_scheduled: "",
      description: "",
      technician_name: "",
      hours_before: "",
      hours_after: "",
      parts_replaced: [],
      cost: "",
      status: "completado",
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const statusColors = {
    completado: "bg-green-100 text-green-700",
    pendiente: "bg-yellow-100 text-yellow-700",
    en_proceso: "bg-blue-100 text-blue-700",
  };

  const preventiveLogs = logs.filter(l => l.maintenance_type === "preventivo");
  const correctiveLogs = logs.filter(l => l.maintenance_type === "correctivo");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Mantenimiento de Drones</h2>
            <p className="text-sm text-muted-foreground">Preventivo y correctivo</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Registrar Mantenimiento
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{logs.length}</div>
          <p className="text-sm text-muted-foreground">Total registros</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">{preventiveLogs.length}</div>
          <p className="text-sm text-muted-foreground">Preventivos</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{correctiveLogs.length}</div>
          <p className="text-sm text-muted-foreground">Correctivos</p>
        </Card>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <Card className="p-8 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay registros de mantenimiento</p>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">{log.drone_serial}</h3>
                    <Badge className={log.maintenance_type === "preventivo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {log.maintenance_type}
                    </Badge>
                    <Badge className={statusColors[log.status]}>{log.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div>{format(new Date(log.date), "d MMM yyyy", { locale: es })}</div>
                    {log.technician_name && <div>Técnico: {log.technician_name}</div>}
                    {log.hours_before && <div>Horas: {log.hours_before}h → {log.hours_after}h</div>}
                    {log.cost && <div>Costo: ${log.cost}</div>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(log); setForm(log); setShowForm(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(log.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showForm} onOpenChange={open => !open && closeForm()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dron *</label>
              <Select value={form.drone_id} onValueChange={v => {
                const drone = drones.find(d => d.id === v);
                setForm({ ...form, drone_id: v, drone_serial: drone?.serial_number || "" });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {drones.map(d => <SelectItem key={d.id} value={d.id}>{d.serial_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={form.maintenance_type} onValueChange={v => setForm({ ...form, maintenance_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Fecha *</label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full rounded-md border border-input px-3 py-2 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Horas antes</label>
                <Input type="number" value={form.hours_before} onChange={e => setForm({ ...form, hours_before: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Horas después</label>
                <Input type="number" value={form.hours_after} onChange={e => setForm({ ...form, hours_after: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Próximo mantenimiento</label>
              <Input type="date" value={form.next_scheduled} onChange={e => setForm({ ...form, next_scheduled: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Técnico</label>
                <Input value={form.technician_name} onChange={e => setForm({ ...form, technician_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Costo</label>
                <Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button type="submit">{editingRecord ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}