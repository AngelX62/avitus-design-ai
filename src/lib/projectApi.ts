import { supabase } from "@/integrations/supabase/client";

export const deleteProject = (studioId: string, projectId: string) =>
  supabase.from("projects").delete().eq("studio_id", studioId).eq("id", projectId);
