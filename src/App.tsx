import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Intake from "./pages/Intake.tsx";
import Leads from "./pages/Leads.tsx";
import LeadDetail from "./pages/LeadDetail.tsx";
import Projects from "./pages/Projects.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Import from "./pages/Import.tsx";
import PasteMessage from "./pages/PasteMessage.tsx";
import InviteAccept from "./pages/InviteAccept.tsx";
import Avara from "./pages/Avara";
import { AuthProvider } from "./contexts/AuthContext";
import { StudioProvider } from "./contexts/StudioContext";
import { StudioLayout } from "./components/StudioLayout";
import { isSupabaseConfigured, missingSupabaseEnv } from "./integrations/supabase/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

const queryClient = new QueryClient();

const MissingSupabaseConfig = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="max-w-lg border border-border bg-card p-8">
      <div className="micro-label mb-4">CONFIG REQUIRED</div>
      <h1 className="font-serif text-4xl text-ink leading-tight mb-4">Connect Supabase.</h1>
      <p className="text-stone text-sm leading-relaxed mb-5">
        Add the missing Vite environment variables to <code>.env.local</code>, then restart <code>npm run dev</code>.
      </p>
      <pre className="bg-secondary/50 border border-border p-4 text-xs text-ink whitespace-pre-wrap">
        {missingSupabaseEnv.join("\n")}
      </pre>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {isSupabaseConfigured ? (
            <BrowserRouter>
              <AuthProvider>
                <StudioProvider>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/invite/:token" element={<InviteAccept />} />
                    <Route path="/intake" element={<Intake />} />
                    <Route path="/intake/:studioSlug" element={<Intake />} />
                    <Route element={<StudioLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route path="/leads/paste" element={<PasteMessage />} />
                      <Route path="/leads/:id" element={<LeadDetail />} />
                      <Route path="/import" element={<Import />} />
                      <Route path="/avara" element={<Avara />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </StudioProvider>
              </AuthProvider>
            </BrowserRouter>
          ) : (
            <MissingSupabaseConfig />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  </QueryClientProvider>
);

export default App;
