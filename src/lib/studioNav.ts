import {
  FolderOpen,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type StudioNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Lead Inbox", icon: Inbox },
  { to: "/import", label: "Import", icon: Upload },
  { to: "/avara", label: "Avara", icon: MessageCircle },
  { to: "/projects", label: "Projects", icon: FolderOpen },
];
