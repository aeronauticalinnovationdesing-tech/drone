import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProfile } from "@/lib/ProfileContext";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FolderKanban, CheckSquare, Wallet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "../components/dashboard/StatCard";
import { jsPDF } from "jspdf";

const COLORS = ["hsl(38, 92%, 50%)", "hsl(160, 60%, 45%)", "hsl(220, 70%, 50%)", "hsl(280, 65%, 60%)", "hsl(340, 75%, 55%)"];

export default function Reports() {
  const [generating, setGenerating] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list() });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

  // Task status data
  const taskStatusData = [
    { name: "Pendientes", value: tasks.filter(t => t.status === "pending").length },
    { name: "En Progreso", value: tasks.filter(t => t.status === "in_progress").length },
    { name: "Completadas", value: tasks.filter(t => t.status === "completed").length },
    { name: "Canceladas", value: tasks.filter(t => t.status === "cancelled").length },
  ].filter(d => d.value > 0);

  // Expense categories
  const categoryTotals = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    categoryTotals[t.category || "other"] = (categoryTotals[t.category || "other"] || 0) + (t.amount || 0);
  });
  const expenseData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const generatePDF = async () => {
    setGenerating(true);
    const reportContent = `
# Informe Ejecutivo VEXNY
**Fecha:** ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}

## Resumen General
- **Proyectos totales:** ${projects.length} (${projects.filter(p => p.status === "active").length} activos)
- **Tareas totales:** ${tasks.length} (${tasks.filter(t => t.status === "completed").length} completadas)
- **Balance:** $${(totalIncome - totalExpense).toLocaleString()}
- **Ingresos totales:** $${totalIncome.toLocaleString()}
- **Gastos totales:** $${totalExpense.toLocaleString()}

## Proyectos
${projects.map(p => `- **${p.name}** (${p.status}) — Presupuesto: $${(p.budget || 0).toLocaleString()}`).join("\n")}

## Tareas por Estado
- Pendientes: ${tasks.filter(t => t.status === "pending").length}
- En Progreso: ${tasks.filter(t => t.status === "in_progress").length}
- Completadas: ${tasks.filter(t => t.status === "completed").length}

## Gastos por Categoría
${expenseData.map(d => `- ${d.name}: $${d.value.toLocaleString()}`).join("\n")}
`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Genera un informe ejecutivo profesional y motivador basado en estos datos. Incluye recomendaciones estratégicas con mentalidad de guerrero. Formatea con markdown limpio:\n\n${reportContent}`,
    });

    // Create a downloadable text file
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-vexny-${format(new Date(), "yyyy-MM-dd")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Informes</h1>
        </div>
        <Button onClick={generatePDF} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Generar Informe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FolderKanban} label="Proyectos" value={projects.length} subtitle={`${projects.filter(p => p.status === "active").length} activos`} />
        <StatCard icon={CheckSquare} label="Tareas" value={tasks.length} subtitle={`${tasks.filter(t => t.status === "completed").length} completadas`} />
        <StatCard icon={Wallet} label="Balance" value={`$${(totalIncome - totalExpense).toLocaleString()}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Estado de Tareas</h3>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Gastos por Categoría</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          )}
        </div>
      </div>
    </div>
  );
}