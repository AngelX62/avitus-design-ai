import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Settings, LogOut, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStudio } from "@/contexts/StudioContext";
import { ThemeToggle } from "./ThemeToggle";
import { AvaraShell } from "./AvaraShell";
import { AvaraOrb } from "./AvaraOrb";
import { STUDIO_NAV_ITEMS } from "@/lib/studioNav";

export const StudioLayout = () => {
  const { user, loading, signOut } = useAuth();
  const {
    activeStudio,
    studios,
    loading: studioLoading,
    error: studioError,
    refreshStudios,
    setActiveStudioId,
  } = useStudio();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  if (loading || studioLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="border border-border bg-card px-6 py-5 text-center shadow-rest-lit">
          <div className="micro-label">Loading studio</div>
          <div className="mt-3 text-xs text-stone">Checking workspace access...</div>
        </div>
      </div>
    );
  }

  if (studioError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-lg border border-border bg-card p-8 text-center shadow-rest-lit">
          <Logo withWordmark />
          <div className="micro-label mt-8 mb-3">STUDIO LOAD ERROR</div>
          <h1 className="font-serif text-4xl text-ink leading-tight mb-4">Workspace access could not load.</h1>
          <p className="text-sm text-stone leading-relaxed mb-5">{studioError}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void refreshStudios()}
              className="px-5 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={async () => { await signOut(); navigate("/auth"); }}
              className="px-5 py-3 border border-border text-stone text-xs uppercase tracking-[0.18em] hover:border-sage hover:bg-sage-soft/50 hover:text-sage-deep transition-colors"
            >
              Sign out
            </button>
          </div>
          <div className="text-xs text-stone mt-4">{user.email}</div>
        </div>
      </div>
    );
  }

  if (!activeStudio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md border border-border bg-card p-8 text-center">
          <Logo withWordmark />
          <div className="micro-label mt-8 mb-3">INVITE REQUIRED</div>
          <h1 className="font-serif text-4xl text-ink leading-tight mb-4">No studio access yet.</h1>
          <p className="text-sm text-stone leading-relaxed mb-6">
            Avitus workspaces are invite-only. Ask a studio owner for an invite link, then open it while signed in with this email.
          </p>
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="px-5 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors"
          >
            Sign out
          </button>
          <div className="text-xs text-stone mt-4">{user.email}</div>
        </div>
      </div>
    );
  }

  const intakeUrl = `/intake/${activeStudio.slug}`;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-background flex flex-col">
        <div className="px-7 py-8 border-b border-border">
          <Logo withWordmark />
          <div className="mt-5">
            {studios.length > 1 ? (
              <select
                value={activeStudio.id}
                onChange={(event) => setActiveStudioId(event.target.value)}
                className="w-full bg-transparent border border-border px-2 py-2 text-xs text-ink outline-none transition-colors focus:border-sage hover:border-sage/60"
              >
                {studios.map((studio) => (
                  <option key={studio.id} value={studio.id}>{studio.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-stone truncate">{activeStudio.name}</div>
            )}
            <div className="micro-label text-stone mt-2">{activeStudio.role}</div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-0.5">
          {STUDIO_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-sage-soft text-sage-deep border-l-2 border-sage shadow-[var(--inner-highlight)]"
                    : "border-l-2 border-transparent text-stone hover:text-sage-deep hover:bg-sage-soft/50"
                }`
              }
            >
              {to === "/avara" ? (
                <span className="avara-sidebar-orb" aria-hidden="true">
                  <AvaraOrb size={20} state="active" animate={false} />
                </span>
              ) : (
                <Icon size={15} strokeWidth={1.5} />
              )}
              <span>{label}</span>
            </NavLink>
          ))}
          <a
            href={intakeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 text-sm border-l-2 border-transparent text-stone hover:text-sage-deep hover:bg-sage-soft/50 transition-all duration-200"
          >
            <FileText size={15} strokeWidth={1.5} />
            <span>Intake Form</span>
            <ExternalLink size={11} strokeWidth={1.5} className="ml-auto opacity-60" />
          </a>
        </nav>
        <div className="px-4 py-5 border-t border-border space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-sage-soft text-sage-deep border-l-2 border-sage shadow-[var(--inner-highlight)]"
                  : "border-l-2 border-transparent text-stone hover:text-sage-deep hover:bg-sage-soft/50"
              }`
            }
          >
            <Settings size={15} strokeWidth={1.5} />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm border-l-2 border-transparent text-stone hover:text-sage-deep hover:bg-sage-soft/50 transition-all duration-200"
          >
            <LogOut size={15} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
          <div className="px-3 pt-4 truncate text-xs text-stone">{user.email}</div>
        </div>
      </aside>
      <main ref={mainRef} className="relative flex-1 overflow-auto">
        <div className="pointer-events-none fixed right-4 top-4 z-40 md:right-6">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
        <Outlet />
        {location.pathname !== "/avara" && <Colophon />}
        {location.pathname !== "/avara" && <AvaraShell />}
      </main>
    </div>
  );
};

const Colophon = () => (
  <footer className="px-6 md:px-12 mt-24 pt-8 pb-12 border-t border-border/40 flex items-center justify-center gap-3 select-none">
    <span className="font-serif text-sm text-pine/60">Avitus</span>
    <span aria-hidden className="text-stone/35">·</span>
    <span className="micro-label text-stone/50">Studio Edition</span>
    <span aria-hidden className="text-stone/35">·</span>
    <span className="font-serif italic text-xs text-stone/45 tabular-nums">MMXXVI</span>
  </footer>
);
