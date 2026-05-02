import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-foreground">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <div className="text-[15px] font-medium tracking-[-0.02em]">AVITUS<span className="text-accent">.</span></div>
          <div className="micro-label">Studio Operating System</div>
        </div>
      </header>
      <div className="flex-1 grid md:grid-cols-12 max-w-[1400px] mx-auto w-full">
        <div className="md:col-span-7 px-6 md:px-12 py-16 md:border-r border-rule">
          <div className="micro-label mb-6">A · Welcome</div>
          <h1 className="text-[56px] md:text-[80px] leading-[0.98] tracking-[-0.04em] text-foreground">
            Inbound,<br/><span className="text-graphite">composed.</span>
          </h1>
          <p className="mt-8 text-[16px] text-graphite leading-relaxed max-w-md">
            A quiet operating system for interior design studios — capture, qualify, and reply, without the noise.
          </p>
        </div>

        <div className="md:col-span-5 px-6 md:px-12 py-16 bg-panel">
          <div className="micro-label mb-6">B · {mode === "signin" ? "Sign in" : "Create account"}</div>
          <h2 className="text-[32px] tracking-[-0.03em] text-foreground mb-10 leading-[1.05]">
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
              className="w-full bg-foreground text-background py-3.5 text-[11px] tracking-[0.16em] uppercase hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-8 micro-label text-graphite hover:text-foreground transition-colors"
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
      className="w-full bg-transparent border-b border-rule focus:border-foreground outline-none py-2 text-foreground placeholder:text-graphite transition-colors"
    />
  </label>
);

export default Auth;
