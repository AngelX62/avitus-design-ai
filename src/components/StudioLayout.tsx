import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const nav = [
  { to: "/", label: "Overview", end: true },
  { to: "/leads", label: "Inbox" },
  { to: "/projects", label: "Projects" },
  { to: "/designs", label: "Designs" },
  { to: "/import", label: "Import" },
  { to: "/settings", label: "Settings" },
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

  const date = new Date()
    .toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "2-digit" })
    .toUpperCase();

  const initial = (user.email || "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-foreground bg-background sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-10">
            <NavLink to="/" className="text-[15px] font-medium tracking-[-0.02em] text-foreground leading-none">
              AVITUS<span className="text-accent">.</span>
            </NavLink>
            <nav className="hidden md:flex items-baseline gap-6 text-[13px]">
              {nav.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `pb-[2px] transition-colors ${
                      isActive
                        ? "text-foreground border-b border-foreground"
                        : "text-graphite hover:text-foreground"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/intake"
              target="_blank"
              rel="noreferrer"
              className="hidden md:block text-[11px] uppercase tracking-[0.16em] text-graphite hover:text-foreground"
            >
              Intake form ↗
            </a>
            <span className="hidden md:block text-[11px] tracking-[0.16em] text-graphite tabular">{date}</span>
            <button
              onClick={async () => { await signOut(); navigate("/auth"); }}
              title={user.email || "Sign out"}
              className="w-7 h-7 rounded-full bg-foreground text-background text-[11px] flex items-center justify-center hover:opacity-80"
            >
              {initial}
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex gap-5 px-6 pb-3 text-[12px] overflow-x-auto border-t border-rule">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap pt-2 ${isActive ? "text-foreground border-b border-foreground" : "text-graphite"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
