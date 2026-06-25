import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  FolderDown,
  Loader2,
  Network,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDocuments } from "../hooks/useQueries";
import { exportAllAsZip } from "../utils/exports";

interface QuickActionsProps {
  onNewDocument: () => void;
  isCreating: boolean;
  sidebarOpen: boolean;
  isSearchActive: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activateSearch: () => void;
  closeSearch: () => void;
  isFilterOpen: boolean;
  toggleFilter: () => void;
  openGraphView: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export function QuickActions({
  onNewDocument,
  isCreating,
  sidebarOpen,
  isSearchActive,
  searchQuery,
  setSearchQuery,
  activateSearch,
  closeSearch,
  isFilterOpen,
  toggleFilter,
  openGraphView,
  setSidebarOpen,
}: QuickActionsProps) {
  const collapsed = !sidebarOpen;
  const isMobile = useIsMobile();
  const { data: allDocuments } = useDocuments();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  useEffect(() => {
    if (isSearchActive && !isClosing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchActive, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleExportAll = useCallback(async () => {
    if (!allDocuments || allDocuments.length === 0) return;
    setIsExportingZip(true);
    try {
      await exportAllAsZip(allDocuments);
      toast.success(
        `Exported ${allDocuments.length} document${allDocuments.length !== 1 ? "s" : ""} as ZIP`,
      );
      setShowExportDialog(false);
    } catch {
      toast.error("Failed to create ZIP");
    } finally {
      setIsExportingZip(false);
    }
  }, [allDocuments]);

  if ((isSearchActive || isClosing) && !collapsed) {
    return (
      <div className="shrink-0 px-3 py-1.5">
        <div
          className={cn(
            "flex items-center gap-1 origin-left",
            isClosing ? "animate-search-collapse" : "animate-search-expand",
          )}
          onAnimationEnd={() => {
            if (isClosing) {
              setIsClosing(false);
              closeSearch();
            }
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClose();
                }
              }}
              placeholder="Search documents..."
              className="h-7 w-full rounded-md bg-sidebar-accent/50 pl-7 pr-7 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
            />
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-sidebar-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "h-7 w-7 shrink-0",
              isFilterOpen &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            onClick={toggleFilter}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  const tooltipSide = collapsed ? "right" : "bottom";
  const tooltipOffset = collapsed ? 6 : 4;

  const handleGraphView = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
    openGraphView();
  };

  const docCount = allDocuments?.length ?? 0;

  const actions = [
    {
      label: "New document",
      icon: isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      ),
      onClick: onNewDocument,
      disabled: isCreating,
    },
    {
      label: "Search",
      icon: <Search className="h-4 w-4" />,
      onClick: activateSearch,
    },
    {
      label: "Filter",
      icon: <SlidersHorizontal className="h-4 w-4" />,
      onClick: toggleFilter,
      active: isFilterOpen,
    },
    {
      label: "Graph view",
      icon: <Network className="h-4 w-4" />,
      onClick: handleGraphView,
    },
    {
      label: "Export all",
      icon: <FolderDown className="h-4 w-4" />,
      onClick: () => setShowExportDialog(true),
      disabled: docCount === 0,
    },
  ];

  return (
    <>
      <div
        className={cn(
          "shrink-0 flex items-center justify-center",
          collapsed ? "flex-col gap-0.5 py-1" : "gap-1 px-3 py-1.5",
        )}
      >
        {actions.map((action) => {
          const button = (
            <Button
              key={action.label}
              variant="secondary"
              size="icon"
              className={cn(
                "h-7 w-7",
                action.active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
            </Button>
          );

          if (isMobile) return button;

          return (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side={tooltipSide} sideOffset={tooltipOffset}>
                {action.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export all documents</AlertDialogTitle>
            <AlertDialogDescription>
              This will download {docCount} document{docCount !== 1 ? "s" : ""}{" "}
              as a ZIP file of Markdown (.md) files. Each document will include
              its title as a heading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExportingZip}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExportAll();
              }}
              disabled={isExportingZip}
            >
              {isExportingZip && <Loader2 className="h-4 w-4 animate-spin" />}
              {isExportingZip ? "Exporting..." : "Export ZIP"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
