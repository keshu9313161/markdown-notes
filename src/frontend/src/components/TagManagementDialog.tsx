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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  useAllTags,
  useCreateTag,
  useDeleteTag,
  useUpdateTag,
} from "../hooks/useQueries";

const TAG_COLORS = [
  { name: "Gray", value: "gray" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Amber", value: "amber" },
  { name: "Green", value: "green" },
  { name: "Teal", value: "teal" },
  { name: "Blue", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Purple", value: "purple" },
  { name: "Pink", value: "pink" },
];

export const TAG_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  gray: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  green: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/40",
    text: "text-teal-700 dark:text-teal-300",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/40",
    text: "text-pink-700 dark:text-pink-300",
  },
};

const COLOR_DOT_MAP: Record<string, string> = {
  gray: "bg-zinc-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onSelect(color.value)}
          className={cn(
            "h-5 w-5 rounded-full transition-all",
            COLOR_DOT_MAP[color.value],
            selected === color.value
              ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
              : "hover:scale-110",
          )}
          title={color.name}
        />
      ))}
    </div>
  );
}

interface TagManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagManagementDialog({
  open,
  onOpenChange,
}: TagManagementDialogProps) {
  const { data: tags, isLoading, isError } = useAllTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const { mutate: updateTag, isPending: isUpdating } = useUpdateTag();
  const { mutate: deleteTag, isPending: isDeleting } = useDeleteTag();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [tagToDelete, setTagToDelete] = useState<{
    id: bigint;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    createTag(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor("blue");
          toast.success("Tag created");
        },
        onError: (err) => setError(err.message || "Failed to create tag"),
      },
    );
  };

  const handleStartEdit = (tag: {
    id: bigint;
    name: string;
    color: string;
  }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError("");
  };

  const handleSaveEdit = () => {
    if (editingId === null || !editName.trim()) return;
    setError("");
    updateTag(
      { id: editingId, name: editName.trim(), color: editColor },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Tag updated");
        },
        onError: (err) => setError(err.message || "Failed to update tag"),
      },
    );
  };

  const handleDelete = () => {
    if (!tagToDelete) return;
    deleteTag(
      { id: tagToDelete.id },
      {
        onSuccess: () => {
          toast.success("Tag deleted");
          setTagToDelete(null);
        },
        onError: () => toast.error("Failed to delete tag"),
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New tag name..."
              maxLength={50}
              className="flex-1 h-8 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>

          <div className="mb-1">
            <p className="text-xs text-muted-foreground mb-1.5">Color</p>
            <ColorPicker selected={newColor} onSelect={setNewColor} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <ScrollArea className="max-h-64">
            {isLoading && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading tags...
              </p>
            )}
            {isError && (
              <p className="text-sm text-destructive py-4 text-center">
                Failed to load tags.
              </p>
            )}
            {tags && tags.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tags yet.
              </p>
            )}
            <div className="space-y-1.5">
              {tags?.map((tag) => {
                const isEditing = editingId === tag.id;
                const colors = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.gray;

                if (isEditing) {
                  return (
                    <div
                      key={tag.id.toString()}
                      className="rounded-md border border-border p-2 space-y-2"
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={50}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit();
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                      />
                      <ColorPicker
                        selected={editColor}
                        onSelect={setEditColor}
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={handleSaveEdit}
                          disabled={isUpdating || !editName.trim()}
                        >
                          {isUpdating && (
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={tag.id.toString()}
                    className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium max-w-[10rem] truncate",
                        colors.bg,
                        colors.text,
                      )}
                    >
                      {tag.name}
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(tag)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setTagToDelete({ id: tag.id, name: tag.name })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!tagToDelete}
        onOpenChange={() => setTagToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;
              <span className="truncate inline-block max-w-[12rem] align-bottom">
                {tagToDelete?.name}
              </span>
              &rdquo; will be removed from all documents. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
