import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Lock, Check } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const ROLE_CONFIG = {
  supervisor: { label: 'Supervisor', color: 'bg-red-100 text-red-800', desc: 'Gestiona usuarios y accesos' },
  jefe_piloto_uas: { label: 'Jefe de Piloto UAS', color: 'bg-blue-100 text-blue-800', desc: 'Supervisa pilotos' },
  gerente_sms: { label: 'Gerente de SMS', color: 'bg-green-100 text-green-800', desc: 'Reportes SMS' },
  piloto_uas: { label: 'Piloto UAS', color: 'bg-yellow-100 text-yellow-800', desc: 'Vuela y reporta' }
};

export default function UserManagement() {
  const { currentUser, currentCompanyId } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'piloto_uas', phone: '' });
  const queryClient = useQueryClient();

  // Check if user is supervisor
  const isSupervisor = currentUser?.company_role === 'supervisor';

  // Fetch company users
  const { data: users = [] } = useQuery({
    queryKey: ['companyUsers', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      const result = await base44.entities.CompanyUser.filter({ company_id: currentCompanyId });
      return result;
    },
    enabled: !!currentCompanyId
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      return base44.entities.CompanyUser.create({
        ...userData,
        company_id: currentCompanyId,
        access_password: tempPassword,
        created_by_supervisor: currentUser?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyUsers', currentCompanyId] });
      setFormData({ email: '', full_name: '', role: 'piloto_uas', phone: '' });
      setIsDialogOpen(false);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.CompanyUser.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyUsers', currentCompanyId] });
    }
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name) return;
    createUserMutation.mutate(formData);
  };

  if (!isSupervisor) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">Solo los supervisores pueden gestionar usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jefe_piloto_uas">Jefe de Piloto UAS</SelectItem>
                    <SelectItem value="gerente_sms">Gerente de SMS</SelectItem>
                    <SelectItem value="piloto_uas">Piloto UAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Crear Usuario</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay usuarios registrados</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="border rounded-lg p-4 flex justify-between items-start bg-card">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{user.full_name}</h3>
                  <Badge className={ROLE_CONFIG[user.role]?.color}>
                    {ROLE_CONFIG[user.role]?.label}
                  </Badge>
                  {user.is_active ? (
                    <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
                {user.access_password && (
                  <div className="mt-2 p-2 bg-amber-50 rounded flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-mono text-amber-900">Contraseña: {user.access_password}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteUserMutation.mutate(user.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}