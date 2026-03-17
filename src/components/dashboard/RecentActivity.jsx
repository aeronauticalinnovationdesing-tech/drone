import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { icon: Circle, color: "text-muted-foreground" },
  in_progress: { icon: Clock, color: "text-primary" },
  completed: { icon: CheckCircle2, color: "text-green-500" },
  cancelled: { icon: AlertCircle, color: "text-destructive" },
};

export default function RecentActivity({ tasks = [] }) {
  if (!tasks.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sin actividad reciente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.slice(0, 6).map((task) => {
        const config = statusConfig[task.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.due_date && format(new Date(task.due_date), "d MMM", { locale: es })}
              </p>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              task.priority === "critical" && "bg-red-100 text-red-700",
              task.priority === "high" && "bg-orange-100 text-orange-700",
              task.priority === "medium" && "bg-primary/10 text-primary",
              task.priority === "low" && "bg-green-100 text-green-700",
            )}>
              {task.priority}
            </span>
          </div>
        );
      })}
    </div>
  );
}