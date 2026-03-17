import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Trophy, Zap, Target } from "lucide-react";

const LEVEL_THRESHOLDS = [0, 25, 50, 75, 90, 100];

function getLevel(pct) {
  if (pct >= 100) return { label: "COMPLETADO", icon: Trophy, color: "text-yellow-400", bar: "from-yellow-400 to-amber-500" };
  if (pct >= 75) return { label: "CASI LISTO", icon: Flame, color: "text-orange-400", bar: "from-orange-400 to-red-500" };
  if (pct >= 50) return { label: "A MITAD", icon: Zap, color: "text-blue-400", bar: "from-blue-400 to-indigo-500" };
  if (pct >= 25) return { label: "EN MARCHA", icon: Target, color: "text-green-400", bar: "from-green-400 to-emerald-500" };
  return { label: "INICIANDO", icon: Target, color: "text-muted-foreground", bar: "from-primary/60 to-primary" };
}

const statusColors = {
  planning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-primary/20 text-primary border-primary/30",
};

export default function ProjectProgressBars({ projects, tasks }) {
  const activeProjects = projects.filter(p => p.status !== "completed").slice(0, 6);

  if (!activeProjects.length) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-base">Batallas en Curso</h2>
        </div>
        <Link to="/Projects" className="text-primary text-xs font-medium flex items-center gap-1 hover:underline">
          Ver todo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {activeProjects.map(project => {
          const pts = tasks.filter(t => t.project_id === project.id);
          const done = pts.filter(t => t.status === "completed").length;
          const pct = pts.length > 0 ? Math.round((done / pts.length) * 100) : 0;
          const level = getLevel(pct);
          const LevelIcon = level.icon;
          const budgetUsed = project.budget > 0 ? Math.min(Math.round(((project.spent || 0) / project.budget) * 100), 100) : null;

          return (
            <div key={project.id} className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: project.color || "#F59E0B", boxShadow: `0 0 8px ${project.color || "#F59E0B"}60` }} />
                  <span className="font-semibold text-sm truncate">{project.name}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <LevelIcon className={`w-3.5 h-3.5 ${level.color}`} />
                  <span className={`text-[10px] font-bold ${level.color}`}>{level.label}</span>
                </div>
              </div>

              {/* Task progress bar */}
              <div className="mb-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-muted-foreground">Tareas</span>
                  <span className="text-[11px] font-bold">{done}/{pts.length} <span className="text-primary">{pct}%</span></span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${level.bar} transition-all duration-700 ease-out relative`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 10 && (
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" style={{ animationDuration: "2s" }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Budget bar */}
              {budgetUsed !== null && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-muted-foreground">Presupuesto</span>
                    <span className={`text-[11px] font-bold ${budgetUsed > 85 ? "text-red-400" : budgetUsed > 60 ? "text-yellow-400" : "text-green-400"}`}>
                      ${(project.spent || 0).toLocaleString()} / ${project.budget.toLocaleString()} ({budgetUsed}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${budgetUsed > 85 ? "bg-gradient-to-r from-red-500 to-rose-600" : budgetUsed > 60 ? "bg-gradient-to-r from-yellow-400 to-orange-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`}
                      style={{ width: `${budgetUsed}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Milestone chips */}
              {project.milestones?.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {project.milestones.slice(0, 3).map((m, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.completed ? "bg-green-500/10 text-green-400 border-green-500/20 line-through" : "bg-muted text-muted-foreground border-border"}`}>
                      {m.completed ? "✓ " : ""}{m.title}
                    </span>
                  ))}
                  {project.milestones.length > 3 && <span className="text-[10px] text-muted-foreground">+{project.milestones.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}