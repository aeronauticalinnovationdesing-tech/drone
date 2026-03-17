import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, StickyNote, Pin, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const categoryLabels = { general: "General", project: "Proyecto", personal: "Personal", ideas: "Ideas", meeting: "Reunión" };
const categoryColors = {
  general: "bg-blue-100 text-blue-700",
  project: "bg-primary/10 text-primary",
  personal: "bg-purple-100 text-purple-700",
  ideas: "bg-green-100 text-green-700",
  meeting: "bg-orange-100 text-orange-700",
};

export default function Notes() {
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", pinned: false });
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.Note.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const resetForm = () => {
    setForm({ title: "", content: "", category: "general", pinned: false });
    setEditNote(null);
    setShowForm(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editNote) {
      updateMutation.mutate({ id: editNote.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (note) => {
    setEditNote(note);
    setForm({ title: note.title, content: note.content || "", category: note.category || "general", pinned: note.pinned || false });
    setShowForm(true);
  };

  const togglePin = (note) => {
    updateMutation.mutate({ id: note.id, data: { ...note, pinned: !note.pinned } });
  };

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StickyNote className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notas</h1>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(note => (
          <div key={note.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all group relative">
            {note.pinned && <Pin className="w-4 h-4 text-primary absolute top-4 right-4" />}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{note.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4 mb-3">{note.content}</p>
            <div className="flex items-center justify-between">
              <Badge className={cn("text-xs", categoryColors[note.category])}>{categoryLabels[note.category]}</Badge>
              <span className="text-xs text-muted-foreground">
                {note.created_date && format(new Date(note.created_date), "d MMM", { locale: es })}
              </span>
            </div>
            <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => togglePin(note)}>
                <Pin className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(note)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(note.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-20">
          <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aún no tienes notas. ¡Empieza a escribir!</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); else setShowForm(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editNote ? "Editar Nota" : "Nueva Nota"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Contenido</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="min-h-[120px]" /></div>
            <div><Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}