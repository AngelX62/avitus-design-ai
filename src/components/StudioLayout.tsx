import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Sparkles, Users, FolderOpen, Settings, LogOut } from "lucide-react";
import { useEffect } from "react";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/designs", label: "Designs", icon: Sparkles },
  { to: "/projects", label: "Projects", icon: FolderOpen },
];

export const StudioLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="micro-label">Loading studio</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-background flex flex-col">
        <div className="px-7 py-8 border-b border-border">
          <Logo withWordmark />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-secondary text-ink"
                    : "text-stone hover:text-ink hover:bg-secondary/50"
                }`
              }
            >
              <Icon size={15} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-5 border-t border-border space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-secondary text-ink" : "text-stone hover:text-ink hover:bg-secondary/50"
              }`
            }
          >
            <Settings size={15} strokeWidth={1.5} />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-stone hover:text-ink hover:bg-secondary/50 transition-colors"
          >
            <LogOut size={15} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
          <div className="px-3 pt-4 truncate text-xs text-stone">{user.email}</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};