import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ExternalLink } from "lucide-react";
import { useEffect } from "react";

const nav = [
  { to: "/", num: "01", label: "Overview", end: true },
  { to: "/leads", num: "02", label: "Lead Inbox" },
  { to: "/import", num: "03", label: "Import" },
  { to: "/projects", num: "04", label: "Projects" },
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
      <aside className="w-64 border-r border-hairline bg-cream flex flex-col">
        <div className="px-7 py-9 border-b border-hairline">
          <Logo withWordmark />
          <div className="micro-label mt-3 text-[10px] tracking-[0.28em]">
            Studio Operating System
          </div>
        </div>
        <nav className="flex-1 px-3 py-7 space-y-px">
          {nav.map(({ to, num, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-baseline gap-4 pl-5 pr-3 py-3 text-sm transition-colors ${
                  isActive
                    ? "text-ink before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-terracotta"
                    : "text-stone hover:text-ink"
                }`
              }
            >
              <span className="micro-label text-[10px] w-5">{num}</span>
              <span className="font-serif text-[18px] tracking-tight">{label}</span>
            </NavLink>
          ))}
          <a
            href="/intake"
            target="_blank"
            rel="noreferrer"
            className="flex items-baseline gap-4 pl-5 pr-3 py-3 text-sm text-stone hover:text-ink"
          >
            <span className="micro-label text-[10px] w-5">↗</span>
            <span className="font-serif text-[18px] tracking-tight flex-1">Intake Form</span>
            <ExternalLink size={11} strokeWidth={1.5} className="opacity-50" />
          </a>
        </nav>
        <div className="px-3 py-5 border-t border-hairline space-y-px">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `relative flex items-baseline gap-4 pl-5 pr-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "text-ink before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-terracotta"
                  : "text-stone hover:text-ink"
              }`
            }
          >
            <span className="micro-label text-[10px] w-5">·</span>
            <span className="font-serif text-[17px] tracking-tight">Settings</span>
          </NavLink>
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="w-full flex items-baseline gap-4 pl-5 pr-3 py-2.5 text-sm text-stone hover:text-ink transition-colors"
          >
            <span className="micro-label text-[10px] w-5"><LogOut size={11} strokeWidth={1.5} /></span>
            <span className="font-serif text-[17px] tracking-tight">Sign out</span>
          </button>
          <div className="px-5 pt-5 truncate text-[11px] text-stone/80 italic-serif">{user.email}</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};