import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { fromNanoseconds } from "../utils/formatting";

export interface DocumentSummary {
  id: bigint;
  title: string;
  content?: string;
  updatedAt: bigint;
}

interface ContentSnippet {
  before: string;
  match: string;
  after: string;
}

function getContentSnippet(
  content: string,
  query: string,
): ContentSnippet | null {
  if (!content || !query) return null;
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const pad = 30;
  const start = Math.max(0, idx - pad);
  const end = Math.min(content.length, idx + query.length + pad);
  const before =
    (start > 0 ? "..." : "") + content.slice(start, idx).replace(/\n/g, " ");
  const match = content.slice(idx, idx + query.length).replace(/\n/g, " ");
  const after =
    content.slice(idx + query.length, end).replace(/\n/g, " ") +
    (end < content.length ? "..." : "");
  return { before, match, after };
}

export function DocumentListExpanded({
  searchResults,
  isSearching,
  isSearchError,
  selectedDocId,
  selectDoc,
  searchQuery,
  isSearchActive,
  filterTagIds,
  setSidebarOpen,
}: {
  searchResults?: DocumentSummary[] | null;
  isSearching: boolean;
  isSearchError: boolean;
  selectedDocId: bigint | null;
  selectDoc: (id: bigint | null) => void;
  searchQuery: string;
  isSearchActive: boolean;
  filterTagIds: bigint[];
  setSidebarOpen: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  const isFiltering = isSearchActive || filterTagIds.length > 0;
  const documents = searchResults ?? [];
  const loading = isSearching;
  const error = isSearchError;

  const handleSelectDoc = (id: bigint) => {
    selectDoc(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <ScrollArea className="flex-1 overflow-hidden [&>div>div]:!block">
      <div className="px-2 py-1 overflow-hidden">
        {loading && (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            {isFiltering ? "Searching..." : "Loading..."}
          </div>
        )}

        {error && (
          <div className="px-2 py-3 text-sm text-destructive">
            {isFiltering ? "Search failed." : "Failed to load documents."}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            {isFiltering ? "No matching documents." : "No documents yet."}
          </div>
        )}

        {documents.map((doc) => {
          const snippet =
            searchQuery && doc.content
              ? getContentSnippet(doc.content, searchQuery)
              : null;

          return (
            <button
              type="button"
              key={doc.id.toString()}
              onClick={() => handleSelectDoc(doc.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 transition-colors",
                "hover:bg-sidebar-accent/50",
                selectedDocId === doc.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground",
              )}
            >
              <FileText className="w-4 h-4 shrink-0 opacity-50" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate leading-snug">{doc.title}</p>
                {snippet ? (
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {snippet.before}
                    <span className="font-semibold text-sidebar-foreground">
                      {snippet.match}
                    </span>
                    {snippet.after}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {formatDistanceToNow(fromNanoseconds(doc.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
