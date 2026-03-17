import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, subtitle, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}