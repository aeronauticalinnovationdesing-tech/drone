import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatCOP = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);

export default function MaintenanceManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form, setForm] = useState({
    drone_serial: "",
    policy_number: "",
    provider: "",
    coverage_type: "basica",
    start_date: "",
    expiry_date: "",
    monthly_cost_cop: "",
    coverage_limit_cop: "",
    includes_accidental: true,
    includes_theft: true,
    status: "activa",
  });
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery({
    queryKey: ["maintenance_policies"],
    queryFn: () => base44.entities.MaintenancePolicy.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.MaintenancePolicy.create({
        ...data,
        monthly_cost_cop: Number(data.monthly_cost_cop),
        coverage_limit_cop: Number(data.coverage_limit_cop),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_policies"] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.MaintenancePolicy.update(id, {
        ...data,
        monthly_cost_cop: Number(data.monthly_cost_cop),
        coverage_limit_cop: Number(data.coverage_limit_cop),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_policies"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenancePolicy.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance_policies"] }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingPolicy(null);
    setForm({
      drone_serial: "",
      policy_number: "",
      provider: "",
      coverage_type: "basica",
      start_date: "",
      expiry_date: "",
      monthly_cost_cop: "",
      coverage_limit_cop: "",
      includes_accidental: true,
      includes_theft: true,
      status: "activa",
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (policy) => {
    setEditingPolicy(policy);
    setForm(policy);
    setShowForm(true);
  };

  const getExpiryStatus = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { status: "vencida", color: "text-red-600", icon: AlertTriangle };
    if (days <= 30) return { status: "próxima", color: "text-yellow-600", icon: AlertCircle };
    return { status: "vigente", color: "text-emerald-600", icon: CheckCircle };
  };

  const totalMonthlyCost = policies.filter(p => p.status === "activa").reduce((sum, p) => sum + (p.monthly_cost_cop || 0), 0);
  const totalCoverage = policies.filter(p => p.status === "activa").reduce((sum, p) => sum + (p.coverage_limit_cop || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pólizas de Mantenimiento</h1>
          <p className="text-sm text-muted-foreground">Gestión de seguros y mantenimiento</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Póliza
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Costo Mensual Total</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCOP(totalMonthlyCost)}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{policies.filter(p => p.status === "activa").length} pólizas activas</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Cobertura Total</p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCOP(totalCoverage)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Protección activa en drones</p>
        </div>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => {
          const expiry = getExpiryStatus(policy.expiry_date);
          const ExpiryIcon = expiry.icon;
          return (
            <div key={policy.id} className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">Dron {policy.drone_serial}</h3>
                    <Badge variant={policy.status === "activa" ? "default" : "destructive"}>
                      {policy.status}
                    </Badge>
                    <Badge variant="outline">{policy.coverage_type}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Póliza</p>
                      <p className="font-mono text-xs">{policy.policy_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Asegurador</p>
                      <p>{policy.provider}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Costo Mensual</p>
                      <p className="font-semibold">{formatCOP(policy.monthly_cost_cop)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cobertura</p>
                      <p className="font-semibold">{formatCOP(policy.coverage_limit_cop)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-3">
                    <ExpiryIcon className={cn("w-4 h-4", expiry.color)} />
                    <span className="text-sm">
                      <span className="font-semibold">Vencimiento:</span>{" "}
                      {format(new Date(policy.expiry_date), "d MMM yyyy", { locale: es })}
                      <span className={cn("ml-2 font-semibold", expiry.color)}>({expiry.status})</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {policy.includes_accidental && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">✓ Accidentes</Badge>
                    )}
                    {policy.includes_theft && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">✓ Robo</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(policy)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(policy.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Editar Póliza" : "Nueva Póliza"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Serial del Dron</label>
                <Input
                  value={form.drone_serial}
                  onChange={(e) => setForm({ ...form, drone_serial: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Número de Póliza</label>
                <Input
                  value={form.policy_number}
                  onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Asegurador</label>
                <Input
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Cobertura</label>
                <Select
                  value={form.coverage_type}
                  onValueChange={(v) => setForm({ ...form, coverage_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basica">Básica</SelectItem>
                    <SelectItem value="completa">Completa</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha Inicio</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Vencimiento</label>
                <Input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Costo Mensual (COP)</label>
                <Input
                  type="number"
                  value={form.monthly_cost_cop}
                  onChange={(e) => setForm({ ...form, monthly_cost_cop: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Límite Cobertura (COP)</label>
                <Input
                  type="number"
                  value={form.coverage_limit_cop}
                  onChange={(e) => setForm({ ...form, coverage_limit_cop: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit">{editingPolicy ? "Actualizar" : "Crear Póliza"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}