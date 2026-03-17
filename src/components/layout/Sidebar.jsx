import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, FolderKanban, CheckSquare, 
  Wallet, Calendar, StickyNote, Bot, FileText,
  ChevronLeft, ChevronRight, Sword, LogOut, User, X, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";


const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/Dashboard" },
  { icon: FolderKanban, label: "Proyectos", path: "/Projects" },
  { icon: CheckSquare, label: "Tareas", path: "/Tasks" },
  { icon: StickyNote, label: "Notas", path: "/Notes" },
  { icon: Wallet, label: "Contabilidad", path: "/Accounting" },
  { icon: Calendar, label: "Calendario", path: "/Calendar" },
  { icon: Bot, label: "Secretaria", path: "/Secretary" },
  { icon: FileText, label: "Informes", path: "/Reports" },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [location.pathname]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const SidebarContent = (
    <aside className={cn(
      "h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Sword className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight text-white">VEXNY</span>}
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name || "Usuario"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
            </div>
            <button
              onClick={() => base44.auth.logout()}
              className="text-sidebar-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => base44.auth.logout()}
              className="text-sidebar-foreground/40 hover:text-destructive transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors flex-shrink-0"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-50">
        {SidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={onMobileClose} />
          <div className="relative h-full z-10">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}