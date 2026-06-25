import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useDocuments } from "../hooks/useQueries";
import type { SortBy } from "../utils/types";

export function DocumentListCollapsed({
  selectedDocId,
  selectDoc,
  sortBy,
}: {
  selectedDocId: bigint | null;
  selectDoc: (id: bigint | null) => void;
  sortBy: SortBy;
}) {
  const { data: documents, isLoading, isError } = useDocuments("", [], sortBy);

  if (isLoading || isError || !documents || documents.length === 0) return null;

  return (
    <ScrollArea className="flex-1 overflow-hidden">
      <div className="flex flex-col items-center gap-0.5 py-1">
        {documents.map((doc) => (
          <Tooltip key={doc.id.toString()}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => selectDoc(doc.id)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  "hover:bg-sidebar-accent/50",
                  selectedDocId === doc.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground",
                )}
              >
                <FileText className="h-4 w-4 opacity-60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              {doc.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </ScrollArea>
  );
}
