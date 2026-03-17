import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ProjectForm({ open, onOpenChange, onSave, project }) {
  const [form, setForm] = useState(project || {
    name: "", description: "", status: "planning", budget: 0, color: "#F59E0B", start_date: "", end_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, budget: Number(form.budget) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del proyecto" required />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planeación</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Presupuesto</Label>
              <Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-20 p-1" />
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