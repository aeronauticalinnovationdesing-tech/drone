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

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden h-16 border-t border-border bg-card pb-safe z-40 overflow-x-auto overflow-y-hidden scrollbar-hide">
      <div className="flex items-center gap-1 h-full px-2 w-fit">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 whitespace-nowrap",
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
      </div>
    </nav>
  );
}