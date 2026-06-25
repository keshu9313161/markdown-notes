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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { History, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRestoreVersion, useVersions } from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

interface VersionHistorySheetProps {
  docId: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

export function VersionHistorySheet({
  docId,
  open,
  onOpenChange,
  onRestored,
}: VersionHistorySheetProps) {
  const {
    data: versions,
    isLoading,
    isError,
  } = useVersions(open ? docId : null);
  const { mutate: restoreVersion, isPending } = useRestoreVersion();
  const [restoreIndex, setRestoreIndex] = useState<number | null>(null);

  const handleRestore = () => {
    if (restoreIndex === null) return;
    restoreVersion(
      { id: docId, versionIndex: BigInt(restoreIndex) },
      {
        onSuccess: () => {
          toast.success("Version restored");
          setRestoreIndex(null);
          onOpenChange(false);
          onRestored();
        },
        onError: () => toast.error("Failed to restore version"),
      },
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Version History
            </SheetTitle>
            <SheetDescription>
              Past saves for this document. Restore any version to revert.
            </SheetDescription>
          </SheetHeader>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="px-4 text-sm text-destructive">
              Failed to load versions.
            </p>
          )}

          {!isLoading && !isError && versions && versions.length === 0 && (
            <p className="px-4 text-sm text-muted-foreground">
              No versions saved yet. Versions are created automatically when you
              edit.
            </p>
          )}

          {!isLoading && !isError && versions && versions.length > 0 && (
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-1 pb-4">
                {[...versions].reverse().map((version, reverseIdx) => {
                  const originalIndex = versions.length - 1 - reverseIdx;
                  const savedAt = fromNanoseconds(version.savedAt);
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                      key={reverseIdx}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {version.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(savedAt, "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setRestoreIndex(originalIndex)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={restoreIndex !== null}
        onOpenChange={() => setRestoreIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              The document&apos;s title and content will be replaced with this
              version. Your current content will still be available in the
              version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRestore();
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
