import { Component, type ErrorInfo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Avitus render error", error, errorInfo);
  }

  private reloadApp = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private signOut = async () => {
    try {
      localStorage.removeItem("avitus.activeStudioId");
      await supabase.auth.signOut();
    } finally {
      window.location.assign("/auth");
    }
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-background px-6 py-10 text-ink">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
          <div className="w-full border border-border bg-card p-8 shadow-rest-lit">
            <div className="micro-label mb-4">APP ERROR</div>
            <h1 className="font-serif text-4xl leading-tight text-ink">Avitus hit a render error.</h1>
            <p className="mt-4 text-sm leading-7 text-stone">
              The app caught the crash instead of leaving a blank page. Reload the app first; if it keeps happening,
              sign out and come back in with a fresh studio session.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-5 max-h-40 overflow-auto border border-border bg-secondary/50 p-4 text-xs leading-5 text-ink">
                {error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={this.reloadApp}
                className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-ink/90"
              >
                Reload app
              </button>
              <button
                type="button"
                onClick={() => void this.signOut()}
                className="border border-border px-5 py-3 text-xs uppercase tracking-[0.18em] text-stone transition-colors hover:border-sage hover:bg-sage-soft/50 hover:text-sage-deep"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
