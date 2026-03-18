import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { differenceInDays } from "date-fns";

export default function AerocivialFilings() {
  const user = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [editingFiling, setEditingFiling] = useState(null);
  const [form, setForm] = useState({
    filing_number: "",
    filing_date: format(new Date(), "yyyy-MM-dd"),
    filing_type: "certificacion_operador",
    description: "",
    status: "radicado",
    expected_resolution: "",
    resolution_date: "",
    observations: "",
    responsible_person: user?.full_name || "",
  });
  const queryClient = useQueryClient();

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Company.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  // Fetch filings
  const { data: filings = [] } = useQuery({
    queryKey: ["filings", company?.id],
    queryFn: () => base44.entities.AerocivialFiling.filter({ company_id: company.id }, "-filing_date"),
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AerocivialFiling.create({ ...data, company_id: company.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["filings"] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AerocivialFiling.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["filings"] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AerocivialFiling.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["filings"] }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingFiling(null);
    setForm({
      filing_number: "",
      filing_date: format(new Date(), "yyyy-MM-dd"),
      filing_type: "certificacion_operador",
      description: "",
      status: "radicado",
      expected_resolution: "",
      resolution_date: "",
      observations: "",
      responsible_person: user?.full_name || "",
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingFiling) {
      updateMutation.mutate({ id: editingFiling.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const statusColors = {
    radicado: "bg-blue-100 text-blue-700",
    en_evaluacion: "bg-yellow-100 text-yellow-700",
    aprobado: "bg-green-100 text-green-700",
    rechazado: "bg-red-100 text-red-700",
    suspendido: "bg-orange-100 text-orange-700",
  };

  const typeLabels = {
    certificacion_operador: "Certificación Operador",
    renovacion_certificado: "Renovación Cert.",
    autorizacion_especial: "Autorización Especial",
    cambio_pilotos: "Cambio de Pilotos",
    cambio_drones: "Cambio de Drones",
    otro: "Otro",
  };

  const pendingFilings = filings.filter(f => !["aprobado", "rechazado"].includes(f.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Radicados Aerocivil</h2>
            <p className="text-sm text-muted-foreground">Control de gestiones ante la autoridad</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Radicado
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{filings.length}</div>
          <p className="text-sm text-muted-foreground">Total</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{filings.filter(f => f.status === "radicado").length}</div>
          <p className="text-sm text-muted-foreground">Radicados</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{filings.filter(f => f.status === "en_evaluacion").length}</div>
          <p className="text-sm text-muted-foreground">En evaluación</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{filings.filter(f => f.status === "aprobado").length}</div>
          <p className="text-sm text-muted-foreground">Aprobados</p>
        </Card>
      </div>

      <div className="space-y-3">
        {filings.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay radicados registrados</p>
          </Card>
        ) : (
          filings.map((filing) => {
            const daysUntilResolution = filing.expected_resolution ? differenceInDays(new Date(filing.expected_resolution), new Date()) : null;
            return (
              <Card key={filing.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">{typeLabels[filing.filing_type]}</h3>
                      <Badge className={statusColors[filing.status]}>{filing.status}</Badge>
                      {filing.filing_number && <Badge variant="outline"># {filing.filing_number}</Badge>}
                    </div>
                    {filing.description && <p className="text-sm text-muted-foreground mb-2">{filing.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div>Radicado: {format(new Date(filing.filing_date), "d MMM yyyy", { locale: es })}</div>
                      {filing.expected_resolution && (
                        <div className={daysUntilResolution !== null && daysUntilResolution <= 7 ? "text-orange-600 font-semibold" : ""}>
                          Resolución esperada: {format(new Date(filing.expected_resolution), "d MMM yyyy", { locale: es })}
                        </div>
                      )}
                      {filing.responsible_person && <div>Responsable: {filing.responsible_person}</div>}
                    </div>
                    {filing.observations && <p className="text-sm text-muted-foreground mt-2"><strong>Observaciones:</strong> {filing.observations}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingFiling(filing); setForm(filing); setShowForm(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(filing.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showForm} onOpenChange={open => !open && closeForm()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFiling ? "Editar Radicado" : "Nuevo Radicado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Radicado *</label>
                <Select value={form.filing_type} onValueChange={v => setForm({ ...form, filing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificacion_operador">Certificación Operador</SelectItem>
                    <SelectItem value="renovacion_certificado">Renovación Certificado</SelectItem>
                    <SelectItem value="autorizacion_especial">Autorización Especial</SelectItem>
                    <SelectItem value="cambio_pilotos">Cambio de Pilotos</SelectItem>
                    <SelectItem value="cambio_drones">Cambio de Drones</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Número de Radicado</label>
                <Input value={form.filing_number} onChange={e => setForm({ ...form, filing_number: e.target.value })} placeholder="Asignado por Aerocivil" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha de Radicación *</label>
                <Input type="date" value={form.filing_date} onChange={e => setForm({ ...form, filing_date: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Resolución Esperada</label>
                <Input type="date" value={form.expected_resolution} onChange={e => setForm({ ...form, expected_resolution: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" className="w-full rounded-md border border-input px-3 py-2 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estado *</label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radicado">Radicado</SelectItem>
                    <SelectItem value="en_evaluacion">En Evaluación</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <Input value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} />
              </div>
            </div>

            {form.status === "aprobado" && (
              <div>
                <label className="text-sm font-medium">Fecha de Resolución</label>
                <Input type="date" value={form.resolution_date} onChange={e => setForm({ ...form, resolution_date: e.target.value })} />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Observaciones</label>
              <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows="2" className="w-full rounded-md border border-input px-3 py-2 text-sm" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button type="submit">{editingFiling ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}