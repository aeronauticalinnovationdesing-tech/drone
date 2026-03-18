import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CourseAccessManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientType, setRecipientType] = useState("user");
  const [message, setMessage] = useState("");

  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-admin"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["courseAccess"],
    queryFn: () => base44.entities.CoursePurchase.list("-created_date"),
  });

  const createAccessMutation = useMutation({
    mutationFn: (data) => base44.entities.CoursePurchase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseAccess"] });
      setMessage("✓ Acceso otorgado exitosamente");
      setSelectedCourse("");
      setRecipientEmail("");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (error) => {
      setMessage("✗ Error: " + error.message);
    }
  });

  const deleteAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.CoursePurchase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseAccess"] });
      setMessage("✓ Acceso eliminado");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (error) => {
      setMessage("✗ Error: " + error.message);
    }
  });

  const handleGrantAccess = () => {
    if (!selectedCourse || !recipientEmail) {
      setMessage("✗ Completa todos los campos");
      return;
    }

    const course = courses.find(c => c.id === selectedCourse);
    
    createAccessMutation.mutate({
      course_id: selectedCourse,
      course_title: course?.title,
      user_email: recipientEmail,
      recipient_type: recipientType,
      amount: 0,
      payment_status: "admin_granted"
    });
  };

  const filteredPurchases = purchases.filter(p => 
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Gestionar Acceso a Cursos</h2>
      </div>
      <p className="text-sm text-muted-foreground">Otorga acceso a cursos a usuarios y empresas manualmente.</p>

      {/* Grant Access Section */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium">Otorgar Acceso a Curso</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona curso" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={recipientType} onValueChange={setRecipientType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Email del usuario/empresa"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />

          <Button 
            onClick={handleGrantAccess}
            disabled={createAccessMutation.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {createAccessMutation.isPending ? "Otorgando..." : "Otorgar"}
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.startsWith('✓') 
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message}
          </div>
        )}
      </Card>

      {/* Access List */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay accesos registrados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPurchases.map(purchase => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{purchase.course_title}</p>
                    <p className="text-xs text-muted-foreground">{purchase.user_email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {purchase.recipient_type === 'company' ? '🏢 Empresa' : '👤 Usuario'}
                      </Badge>
                      {purchase.payment_status === 'admin_granted' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Otorgado por Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteAccessMutation.mutate(purchase.id)}
                    disabled={deleteAccessMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}