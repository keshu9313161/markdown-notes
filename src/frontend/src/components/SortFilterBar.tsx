import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useAllTags } from "../hooks/useQueries";
import type { SortBy } from "../utils/types";
import { TAG_COLOR_MAP } from "./TagManagementDialog";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
];

interface SortFilterBarProps {
  isFilterOpen: boolean;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  filterTagIds: bigint[];
  toggleFilterTag: (tagId: bigint) => void;
  clearFilters: () => void;
}

export function SortFilterBar({
  isFilterOpen: isOpen,
  sortBy,
  setSortBy,
  filterTagIds,
  toggleFilterTag,
  clearFilters,
}: SortFilterBarProps) {
  const { data: tags } = useAllTags();

  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-filter-slide-down data-[state=closed]:animate-filter-slide-up">
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Sort by</p>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger size="sm" className="w-full h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tags && tags.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">
                Filter by
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-input flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 h-7 text-xs whitespace-nowrap shadow-xs outline-none dark:bg-input/30 dark:hover:bg-input/50"
                  >
                    <span className="text-xs truncate">
                      {filterTagIds.length > 0
                        ? `${filterTagIds.length} tag${filterTagIds.length !== 1 ? "s" : ""}`
                        : "All tags"}
                    </span>
                    <ChevronDown className="size-4 opacity-50 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-1">
                  {tags.map((tag) => {
                    const isSelected = filterTagIds.some((id) => id === tag.id);
                    const colors =
                      TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.gray;
                    return (
                      <button
                        type="button"
                        key={tag.id.toString()}
                        onClick={() => toggleFilterTag(tag.id)}
                        className="flex w-full items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium max-w-[8rem] truncate",
                            colors.bg,
                            colors.text,
                          )}
                        >
                          {tag.name}
                        </span>
                      </button>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {(sortBy !== "updated" || filterTagIds.length > 0) && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full h-7 rounded-md border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
