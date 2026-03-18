import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/ProfileContext";

export default function BottomNavigation() {
  const location = useLocation();
  const profileContext = useProfile();
  const { activeProfile = null } = profileContext || {};

  if (!activeProfile) return null;

  const navItems = activeProfile.nav || [];
  const visibleItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center justify-around h-16 border-t border-border bg-card px-2 pb-safe z-40">
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="line-clamp-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}