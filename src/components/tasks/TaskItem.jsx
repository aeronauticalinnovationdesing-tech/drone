import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: AlertCircle,
};

const priorityStyles = {
  low: "bg-green-100 text-green-700",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const priorityLabels = { low: "Baja", medium: "Media", high: "Alta", critical: "Crítica" };

export default function TaskItem({ task, projectName, onEdit, onDelete, onStatusChange }) {
  const StatusIcon = statusIcons[task.status] || Circle;

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all group">
      <button
        onClick={() => onStatusChange(task, task.status === "completed" ? "pending" : "completed")}
        className="flex-shrink-0"
      >
        <StatusIcon className={cn(
          "w-5 h-5 transition-colors",
          task.status === "completed" ? "text-green-500" : "text-muted-foreground hover:text-primary"
        )} />
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", task.status === "completed" && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {projectName && <span className="text-xs text-muted-foreground">{projectName}</span>}
          {task.due_date && (
            <span className="text-xs text-muted-foreground">
              📅 {format(new Date(task.due_date), "d MMM", { locale: es })}
            </span>
          )}
        </div>
      </div>

      <Badge className={cn("text-xs", priorityStyles[task.priority])}>
        {priorityLabels[task.priority]}
      </Badge>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(task)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}