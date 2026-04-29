import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate("/"); }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
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

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-14 bg-ink text-cream">
        <Logo size={36} />
        <div className="max-w-md">
          <div className="micro-label text-cream/50 mb-8">§ STUDIO · INTELLIGENCE</div>
          <h1 className="font-serif text-7xl leading-[0.95] text-cream">
            Inbound,<br /><em className="font-light">composed</em>.
          </h1>
          <p className="mt-10 text-cream/60 italic-serif text-[19px] leading-snug max-w-sm" style={{ color: "rgba(251,246,236,0.6)" }}>
            A quiet operating system for interior design studios — capture, qualify, and reply, without the noise.
          </p>
        </div>
        <div className="micro-label text-cream/40 tracking-[0.32em]">© AVITUS · STUDIO OPERATING SYSTEM</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10"><Logo withWordmark /></div>
          <div className="micro-label mb-4">§ {mode === "signin" ? "WELCOME BACK" : "CREATE STUDIO ACCOUNT"}</div>
          <h2 className="font-serif text-5xl text-ink leading-[0.95] mb-10">
            {mode === "signin" ? "Enter the studio." : "Begin with Avitus."}
          </h2>

          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <Field label="Full name" value={name} onChange={setName} required />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-ink text-cream py-3.5 text-[11px] tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-8 micro-label text-stone hover:text-ink transition-colors"
          >
            {mode === "signin" ? "→ Need an account?" : "→ Already have one?"}
          </button>
        </div>
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
      className="w-full bg-transparent border-b border-hairline focus:border-ink outline-none py-2 text-ink placeholder:text-stone transition-colors"
    />
  </label>
);

export default Auth;