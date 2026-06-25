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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  ChevronRight,
  Download,
  Ellipsis,
  Eye,
  FileText,
  History,
  Link,
  Loader2,
  Pencil,
  Save,
  Settings,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  useAllTags,
  useBacklinks,
  useDeleteDocument,
  useDocument,
  useDocuments,
  useSaveDocument,
  useToggleDocumentTag,
} from "../hooks/useQueries";
import { exportDocument } from "../utils/exports";
import { fromNanoseconds } from "../utils/formatting";
import { MarkdownPreview } from "./MarkdownPreview";
import { TAG_COLOR_MAP, TagManagementDialog } from "./TagManagementDialog";
import { VersionHistorySheet } from "./VersionHistorySheet";
import { WikiLinkAutocomplete } from "./WikiLinkAutocomplete";

const MAX_TAGS_PER_DOCUMENT = 20;
const MAX_CONTENT_LENGTH = 100_000;
const AUTOSAVE_DELAY = 2000;
const SAVED_DISPLAY_MS = 3000;

interface EditorPanelProps {
  docId: bigint;
  selectDoc: (id: bigint | null) => void;
}

export function EditorPanel({ docId, selectDoc }: EditorPanelProps) {
  const isMobile = useIsMobile();
  const { data: doc, isLoading, isError } = useDocument(docId);
  const {
    mutate: saveDocument,
    isPending: isSaving,
    isSuccess: isSaved,
    reset: resetSave,
  } = useSaveDocument();
  const { data: allDocuments } = useDocuments();
  const { data: backlinks } = useBacklinks(docId);
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();
  const { data: allTags } = useAllTags();
  const { mutate: toggleTag } = useToggleDocumentTag();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [autocompleteActive, setAutocompleteActive] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const resizeTextarea = useCallback(() => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  }, []);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const loadedDocId = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when document loads or switches
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!doc) return;
    const docIdStr = doc.id.toString();
    if (loadedDocId.current !== docIdStr) {
      setTitle(doc.title);
      setContent(doc.content);
      setIsDirty(false);
      resetSave();
      loadedDocId.current = docIdStr;
      resizeTextarea();
    }
  }, [doc, resetSave]);

  // Clear "Saved" indicator after 3s
  useEffect(() => {
    if (!isSaved) return;
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => resetSave(), SAVED_DISPLAY_MS);
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [isSaved, resetSave]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Resize textarea when editor pane is toggled back on
  useEffect(() => {
    if (!showEditor) return;
    resizeTextarea();
  }, [showEditor, resizeTextarea]);

  const performSave = useCallback(
    (saveTitle: string, saveContent: string) => {
      if (!doc) return;
      saveDocument(
        {
          id: doc.id,
          title: saveTitle,
          content: saveContent,
          tagIds: doc.tagIds,
        },
        {
          onSuccess: () => setIsDirty(false),
          onError: () => toast.error("Failed to save"),
        },
      );
    },
    [doc, saveDocument],
  );

  // Debounced autosave — restart timer on every edit
  const scheduleAutosave = useCallback(
    (newTitle: string, newContent: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        performSave(newTitle, newContent);
      }, AUTOSAVE_DELAY);
    },
    [performSave],
  );

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsDirty(true);
    resetSave();
    scheduleAutosave(newTitle, content);
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length > MAX_CONTENT_LENGTH) {
      toast.error("Content limit reached (100,000 characters)");
      return;
    }
    setContent(newContent);
    setIsDirty(true);
    resetSave();
    setAutocompleteActive(true);
    setCursorPos(e.target.selectionStart);
    scheduleAutosave(title, newContent);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSelect = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.currentTarget.selectionStart);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const handleAutocompleteSelect = useCallback(
    (selectedTitle: string, insertStart: number, insertEnd: number) => {
      const replacement = `[[${selectedTitle}]]`;
      const newContent =
        content.slice(0, insertStart) + replacement + content.slice(insertEnd);
      setContent(newContent);
      setIsDirty(true);
      resetSave();
      setAutocompleteActive(false);
      const newCursor = insertStart + replacement.length;
      setCursorPos(newCursor);
      scheduleAutosave(title, newContent);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      });
      resizeTextarea();
    },
    [content, title, resetSave, scheduleAutosave],
  );

  const handleWikiLinkNavigate = useCallback(
    (linkTitle: string) => {
      if (!allDocuments) return;
      const target = allDocuments.find(
        (d) => d.title.toLowerCase() === linkTitle.toLowerCase(),
      );
      if (target) {
        selectDoc(target.id);
      } else {
        toast.error(`Document "${linkTitle}" not found`);
      }
    },
    [allDocuments, selectDoc],
  );

  const handleToggleTag = useCallback(
    (tagId: bigint) => {
      if (!doc) return;
      const isRemoving = doc.tagIds.some((t) => t === tagId);
      if (!isRemoving && doc.tagIds.length >= MAX_TAGS_PER_DOCUMENT) {
        toast.error(`Maximum ${MAX_TAGS_PER_DOCUMENT} tags per document`);
        return;
      }
      toggleTag(
        { doc, tagId },
        { onError: () => toast.error("Failed to update tags") },
      );
    },
    [doc, toggleTag],
  );

  const handleExportDocument = useCallback(() => {
    exportDocument(title, content);
    toast.success("Document exported");
  }, [title, content]);

  // Ctrl+S / Cmd+S for immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isDirty) return;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        performSave(title, content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, title, content, performSave]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-destructive">Failed to load document.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border-b border-border">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {isSaving && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {isSaved && (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            {!isSaving && !isSaved && (
              <>
                Edited{" "}
                {formatDistanceToNow(fromNanoseconds(doc.updatedAt), {
                  addSuffix: true,
                })}
              </>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          disabled={!isDirty || isSaving}
          onClick={() => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            performSave(title, content);
          }}
          className="h-7 w-7 text-muted-foreground"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (showEditor && !showPreview) return;
            setShowEditor(!showEditor);
          }}
          className={cn(
            "h-7 w-7",
            showEditor ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (showPreview && !showEditor) return;
            setShowPreview(!showPreview);
          }}
          className={cn(
            "h-7 w-7",
            showPreview ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        {/* Desktop: show all buttons */}
        {!isMobile && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    doc.tagIds.length > 0
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <Tag className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">Tags</p>
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {allTags && allTags.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No tags yet.
                    </p>
                  )}
                  {allTags?.map((tag) => {
                    const isAssigned = doc.tagIds.some((t) => t === tag.id);
                    const colors =
                      TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.gray;
                    return (
                      <button
                        type="button"
                        key={tag.id.toString()}
                        onClick={() => handleToggleTag(tag.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={isAssigned}
                          className="pointer-events-none"
                        />
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium max-w-[10rem] truncate",
                            colors.bg,
                            colors.text,
                          )}
                        >
                          {tag.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-border px-3 py-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowTagManager(true)}
                  >
                    <Settings className="h-3 w-3" />
                    Manage tags
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVersionHistory(true)}
              className="h-7 w-7 text-muted-foreground"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportDocument}
              className="h-7 w-7 text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {/* Mobile: overflow menu */}
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
              >
                <Ellipsis className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowTagPopover(true)}>
                <Tag className="h-4 w-4" />
                Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                <History className="h-4 w-4" />
                Version history
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDocument}>
                <Download className="h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Assigned tags row */}
      {doc.tagIds.length > 0 && allTags && (
        <div className="shrink-0 flex flex-wrap items-center gap-1.5 px-4 py-1.5 border-b border-border">
          {doc.tagIds.map((tagId) => {
            const tag = allTags.find((t) => t.id === tagId);
            if (!tag) return null;
            const colors = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.gray;
            return (
              <span
                key={tag.id.toString()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium max-w-[12rem]",
                  colors.bg,
                  colors.text,
                )}
              >
                <span className="truncate">{tag.name}</span>
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Mobile tag popover (triggered from overflow menu) */}
      {isMobile && (
        <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
          <PopoverTrigger className="sr-only" />
          <PopoverContent align="end" className="w-56 p-0">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">Tags</p>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {allTags && allTags.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No tags yet.
                </p>
              )}
              {allTags?.map((tag) => {
                const isAssigned = doc.tagIds.some((t) => t === tag.id);
                const colors = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.gray;
                return (
                  <button
                    type="button"
                    key={tag.id.toString()}
                    onClick={() => handleToggleTag(tag.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={isAssigned}
                      className="pointer-events-none"
                    />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium max-w-[10rem] truncate",
                        colors.bg,
                        colors.text,
                      )}
                    >
                      {tag.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border px-3 py-1.5">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setShowTagPopover(false);
                  setShowTagManager(true);
                }}
              >
                <Settings className="h-3 w-3" />
                Manage tags
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <TagManagementDialog
        open={showTagManager}
        onOpenChange={setShowTagManager}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{doc.title}&rdquo; will be permanently deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteDocument(
                  { id: doc.id },
                  {
                    onSuccess: () => {
                      toast.success("Document deleted");
                      setShowDeleteDialog(false);
                      selectDoc(null);
                    },
                    onError: () => toast.error("Failed to delete document"),
                  },
                );
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VersionHistorySheet
        docId={doc.id}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestored={() => {
          loadedDocId.current = null;
        }}
      />

      {/* Editor / Preview area */}
      <div className="flex-1 flex min-h-0">
        {showEditor && (
          <div
            className={cn(
              "overflow-y-auto",
              showPreview ? "w-1/2 border-r border-border" : "flex-1",
            )}
          >
            <div
              className={cn("mx-auto px-6 py-6", !showPreview && "max-w-3xl")}
            >
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                maxLength={200}
                className={cn(
                  "h-auto border-none shadow-none rounded-none px-0 py-0",
                  "!text-3xl font-bold tracking-tight",
                  "placeholder:text-muted-foreground/40",
                  "focus-visible:ring-0 focus-visible:border-transparent",
                )}
              />
              <div className="relative mt-4">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onSelect={handleSelect}
                  onClick={handleSelect}
                  placeholder="Start writing..."
                  className={cn(
                    "border-none shadow-none rounded-none px-0 py-0 resize-none overflow-hidden min-h-[60vh]",
                    "text-[15px] leading-relaxed",
                    "placeholder:text-muted-foreground/40",
                    "focus-visible:ring-0 focus-visible:border-transparent",
                  )}
                />
                {autocompleteActive && allDocuments && (
                  <WikiLinkAutocomplete
                    textareaRef={textareaRef}
                    content={content}
                    cursorPos={cursorPos}
                    documents={allDocuments.map((d) => ({
                      id: d.id,
                      title: d.title,
                    }))}
                    currentDocId={docId}
                    onSelect={handleAutocompleteSelect}
                    onDismiss={() => setAutocompleteActive(false)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {showPreview && (
          <div
            className={cn("overflow-y-auto", showEditor ? "w-1/2" : "flex-1")}
          >
            <div
              className={cn("mx-auto px-6 py-6", !showEditor && "max-w-3xl")}
            >
              <h1 className="text-3xl font-bold tracking-tight">
                {title || "Untitled"}
              </h1>
              <div className="mt-4">
                {content ? (
                  <MarkdownPreview
                    content={content}
                    onNavigate={handleWikiLinkNavigate}
                  />
                ) : (
                  <p className="text-muted-foreground/40">Nothing to preview</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backlinks panel */}
      {backlinks && backlinks.length > 0 && (
        <Collapsible defaultOpen>
          <div className="shrink-0 border-t border-border">
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg:first-child]:rotate-90">
              <ChevronRight className="h-3 w-3 transition-transform" />
              <Link className="h-3 w-3" />
              {backlinks.length} backlink{backlinks.length !== 1 && "s"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-3 space-y-0.5">
                {backlinks.map((bl) => (
                  <button
                    type="button"
                    key={bl.id.toString()}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => selectDoc(bl.id)}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{bl.title}</span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
