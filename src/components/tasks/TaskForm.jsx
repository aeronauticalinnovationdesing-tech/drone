import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function TaskForm({ open, onOpenChange, onSave, task, projects = [] }) {
  const [form, setForm] = useState(task || {
    title: "", description: "", status: "pending", priority: "medium",
    project_id: "", due_date: "", estimated_hours: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, estimated_hours: Number(form.estimated_hours) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la tarea" required />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalles..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Proyecto</Label>
              <Select value={form.project_id || "none"} onValueChange={v => setForm({ ...form, project_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha límite</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Horas estimadas</Label>
            <Input type="number" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}