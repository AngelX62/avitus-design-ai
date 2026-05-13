import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { ActiveStudio } from "@/lib/leadTypes";

type StudioContextValue = {
  activeStudio: ActiveStudio | null;
  studios: ActiveStudio[];
  loading: boolean;
  error: string | null;
  refreshStudios: () => Promise<void>;
  setActiveStudioId: (studioId: string) => void;
};

const Ctx = createContext<StudioContextValue>({
  activeStudio: null,
  studios: [],
  loading: true,
  error: null,
  refreshStudios: async () => {},
  setActiveStudioId: () => {},
});

const ACTIVE_STUDIO_STORAGE_KEY = "avitus.activeStudioId";
const STUDIO_LOAD_TIMEOUT_MS = 12_000;

const readStoredActiveStudioId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_STUDIO_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeActiveStudioId = (studioId: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (studioId) window.localStorage.setItem(ACTIVE_STUDIO_STORAGE_KEY, studioId);
    else window.localStorage.removeItem(ACTIVE_STUDIO_STORAGE_KEY);
  } catch {
    // Storage can fail in private or locked-down browser contexts. The in-memory id is enough for this session.
  }
};

const withStudioLoadTimeout = async <T,>(promise: PromiseLike<T>): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Studio access took too long to load. Check the Supabase connection, then retry."));
    }, STUDIO_LOAD_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const errorMessageFor = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Studio access could not load.";
};

type MembershipRow = {
  role: ActiveStudio["role"];
  studio_id: string;
  studios: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [studios, setStudios] = useState<ActiveStudio[]>([]);
  const [activeStudioId, setActiveStudioIdState] = useState<string | null>(() => readStoredActiveStudioId());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshStudios = useCallback(async () => {
    if (!user) {
      setStudios([]);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await withStudioLoadTimeout(
        supabase
          .from("studio_memberships")
          .select("studio_id, role, studios(id, name, slug, created_at, updated_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      );

      if (error) throw new Error(error.message || "Studio access could not load.");

      const nextStudios = ((data ?? []) as unknown as MembershipRow[])
        .filter((row) => row.studios)
        .map((row) => ({
          ...row.studios!,
          role: row.role,
        }));

      setStudios(nextStudios);
      if (!nextStudios.some((studio) => studio.id === activeStudioId)) {
        const first = nextStudios[0]?.id ?? null;
        setActiveStudioIdState(first);
        storeActiveStudioId(first);
      }
      setLoading(false);
    } catch (error) {
      setStudios([]);
      setErrorMessage(errorMessageFor(error));
      setLoading(false);
    }
  }, [activeStudioId, user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshStudios();
  }, [authLoading, refreshStudios]);

  const setActiveStudioId = (studioId: string) => {
    setActiveStudioIdState(studioId);
    storeActiveStudioId(studioId);
  };

  const activeStudio = useMemo(
    () => studios.find((studio) => studio.id === activeStudioId) ?? studios[0] ?? null,
    [activeStudioId, studios],
  );

  return (
    <Ctx.Provider
      value={{
        activeStudio,
        studios,
        loading: authLoading || loading,
        error: errorMessage,
        refreshStudios,
        setActiveStudioId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useStudio = () => useContext(Ctx);
