import { cn } from "@/lib/utils";
import { PenLine } from "lucide-react";

export function BrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center gap-2.5 transition-all duration-200",
        collapsed ? "px-0 py-3 justify-center" : "px-3.5 py-3",
      )}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
        <PenLine className="h-3.5 w-3.5" />
      </div>
      <span
        className={cn(
          "font-display text-[15px] font-semibold tracking-tight text-sidebar-foreground transition-opacity duration-200",
          collapsed && "sr-only",
        )}
      >
        StoryMesh
      </span>
    </div>
  );
}
