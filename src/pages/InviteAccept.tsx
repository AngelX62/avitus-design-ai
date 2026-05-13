import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStudio } from "@/contexts/StudioContext";

const InviteAccept = () => {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const { refreshStudios } = useStudio();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const acceptInvite = useCallback(async () => {
    if (!token || busy) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("accept-invite", { body: { token } });
    setBusy(false);

    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Invite could not be accepted");
      return;
    }

    await refreshStudios();
    toast.success("Invite accepted");
    navigate("/");
  }, [busy, navigate, refreshStudios, token]);

  useEffect(() => {
    if (!loading && user && token) void acceptInvite();
  }, [acceptInvite, loading, user, token]);

  if (!user && !loading) {
    return (
      <InviteShell title="Sign in to accept your invite.">
        <Link
          to={`/auth?invite=${token}`}
          className="inline-flex px-6 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90 transition-colors"
        >
          Continue
        </Link>
      </InviteShell>
    );
  }

  return (
    <InviteShell title={busy ? "Accepting invite..." : "Checking invite..."}>
      <div className="micro-label text-stone">AVITUS STUDIO ACCESS</div>
    </InviteShell>
  );
};

const InviteShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-8">
    <div className="max-w-sm text-center">
      <div className="flex justify-center mb-8"><Logo withWordmark /></div>
      <h1 className="font-serif text-4xl text-ink leading-tight mb-6">{title}</h1>
      {children}
    </div>
  </div>
);

export default InviteAccept;
