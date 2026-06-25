import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DesktopSidebar({
  sidebarOpen,
  children,
}: {
  sidebarOpen: boolean;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-full transition-[width] duration-200 ease-in-out overflow-hidden",
        sidebarOpen ? "w-60" : "w-12",
      )}
    >
      {children}
    </aside>
  );
}
