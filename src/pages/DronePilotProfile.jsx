import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function DronePilotProfile() {
  const user = useCurrentUser();
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pilot profile
  const { data: pilot } = useQuery({
    queryKey: ["pilot-profile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Pilot.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  // Initialize form when pilot data loads
  React.useEffect(() => {
    if (pilot) {
      setForm({
        full_name: pilot.full_name || "",
        document_id: pilot.document_id || "",
        cipu: pilot.cipu || "",
        license_number: pilot.license_number || "",
        license_category: pilot.license_category || "operador_remoto",
        rac_100_phase: pilot.rac_100_phase || "solicitud",
        rac_100_expiry_date: pilot.rac_100_expiry_date || "",
        email: pilot.email || user?.email || "",
        phone: pilot.phone || "",
        status: pilot.status || "activo",
      });
    }
  }, [pilot, user]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (pilot?.id) {
        return base44.entities.Pilot.update(pilot.id, data);
      } else {
        return base44.entities.Pilot.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pilot-profile"] });
      setIsEditing(false);
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const isExpiringSoon = pilot?.rac_100_expiry_date && 
    new Date(pilot.rac_100_expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi Perfil de Piloto</h1>
            <p className="text-sm text-muted-foreground">Gestiona tu información de certificación y licencias</p>
          </div>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancelar" : "Editar Perfil"}
        </Button>
      </div>

      {/* Status Alerts */}
      {pilot && (
        <div className="space-y-2">
          {pilot.status === "suspendido" && (
            <Card className="border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Perfil Suspendido</p>
                <p className="text-sm text-muted-foreground">Tu perfil está suspendido. Contacta con tu administrador.</p>
              </div>
            </Card>
          )}
          {isExpiringSoon && (
            <Card className="border-yellow-600/50 bg-yellow-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-700">Certificado RAC 100 por vencer</p>
                <p className="text-sm text-yellow-600">Tu certificado vence el {format(new Date(pilot.rac_100_expiry_date), "d 'de' MMMM 'de' yyyy")}</p>
              </div>
            </Card>
          )}
          {pilot.status === "activo" && !isExpiringSoon && (
            <Card className="border-green-600/30 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">Perfil activo</p>
                <p className="text-sm text-green-600">Tus certificaciones están al día</p>
              </div>
            </Card>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Información Personal */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg">Información Personal</h2>
          
          <div>
            <label className="text-sm font-medium">Nombre Completo *</label>
            <Input
              value={form.full_name || ""}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Documento de Identidad</label>
              <Input
                value={form.document_id || ""}
                onChange={e => setForm({ ...form, document_id: e.target.value })}
                disabled={!isEditing}
                placeholder="Cédula"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CIPU (RAC 100)</label>
              <Input
                value={form.cipu || ""}
                onChange={e => setForm({ ...form, cipu: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={form.email || ""} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={form.phone || ""}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </Card>

        {/* Certificaciones */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg">Certificaciones RAC 100</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Número de Licencia *</label>
              <Input
                value={form.license_number || ""}
                onChange={e => setForm({ ...form, license_number: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoría de Licencia</label>
              <Select value={form.license_category || "operador_remoto"} onValueChange={v => setForm({ ...form, license_category: v })} disabled={!isEditing}>
                <SelectTrigger disabled={!isEditing}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador_remoto">Operador Remoto</SelectItem>
                  <SelectItem value="piloto_basico">Piloto Básico</SelectItem>
                  <SelectItem value="piloto_avanzado">Piloto Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fase RAC 100</label>
              <Select value={form.rac_100_phase || "solicitud"} onValueChange={v => setForm({ ...form, rac_100_phase: v })} disabled={!isEditing}>
                <SelectTrigger disabled={!isEditing}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solicitud">Solicitud</SelectItem>
                  <SelectItem value="evaluacion">Evaluación</SelectItem>
                  <SelectItem value="capacitacion">Capacitación</SelectItem>
                  <SelectItem value="examen">Examen</SelectItem>
                  <SelectItem value="certificacion">Certificación</SelectItem>
                  <SelectItem value="licencia_emitida">Licencia Emitida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de Vencimiento *</label>
              <Input
                type="date"
                value={form.rac_100_expiry_date || ""}
                onChange={e => setForm({ ...form, rac_100_expiry_date: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>
          </div>
        </Card>

        {/* Estado */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg">Estado</h2>
          
          <div>
            <label className="text-sm font-medium">Estado del Piloto</label>
            <Select value={form.status || "activo"} onValueChange={v => setForm({ ...form, status: v })} disabled={!isEditing}>
              <SelectTrigger disabled={!isEditing}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Actions */}
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}