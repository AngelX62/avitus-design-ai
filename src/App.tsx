import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Designs from "./pages/Designs.tsx";
import DesignNew from "./pages/DesignNew.tsx";
import DesignDetail from "./pages/DesignDetail.tsx";
import Projects from "./pages/Projects.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Import from "./pages/Import.tsx";
import PasteMessage from "./pages/PasteMessage.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { StudioLayout } from "./components/StudioLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/leads/paste" element={<PasteMessage />} />
            <Route element={<StudioLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/import" element={<Import />} />
              <Route path="/designs" element={<Designs />} />
              <Route path="/designs/new" element={<DesignNew />} />
              <Route path="/designs/:id" element={<DesignDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
