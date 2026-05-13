import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(inviteToken ? `/invite/${inviteToken}` : "/");
  }, [user, loading, navigate, inviteToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!inviteToken && !studioName.trim()) {
          toast.error("Studio or real estate name is required");
          return;
        }

        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: inviteToken
              ? `${window.location.origin}/auth?invite=${encodeURIComponent(inviteToken)}`
              : window.location.origin,
            data: {
              full_name: name.trim(),
              ...(studioName.trim() ? { studio_name: studioName.trim() } : {}),
            },
          },
        });
        if (error) throw error;
        toast.success(inviteToken ? "Account created. Accepting invite next." : "Account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const eyebrow = mode === "signin"
    ? "WELCOME BACK"
    : inviteToken
      ? "CREATE TEAM ACCOUNT"
      : "CREATE OWNER ACCOUNT";

  const title = mode === "signin" ? "Enter the studio." : "Begin with Avitus.";

  const subtitle = mode === "signin"
    ? "Sign in to continue working on your leads."
    : inviteToken
      ? "Accept your invite and join the workspace."
      : "A quiet workspace for capturing, cleaning, and following up on leads.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-px w-6 bg-sage mb-5" aria-hidden />
          <Logo />
          <div className="micro-label mt-6 mb-3">{eyebrow}</div>
          <h1 className="font-serif text-4xl text-pine leading-none">{title}</h1>
          <p className="mt-4 text-stone text-[15px] leading-relaxed max-w-xs">{subtitle}</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <>
              {!inviteToken && (
                <Field label="Studio / real estate name" value={studioName} onChange={setStudioName} required />
              )}
              <Field label="Full name" value={name} onChange={setName} required />
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink text-ivory py-3.5 text-xs tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors disabled:opacity-60 mt-2"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="micro-label text-stone hover:text-sage-deep transition-colors"
          >
            {mode === "signin" ? "→ Need an account?" : "→ Already have one?"}
          </button>
        </div>

        <div className="mt-16 text-center micro-label text-stone/60">© Avitus</div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, ...rest }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border focus:border-sage outline-none py-2 text-ink placeholder:text-stone transition-colors"
    />
  </label>
);

export default Auth;
