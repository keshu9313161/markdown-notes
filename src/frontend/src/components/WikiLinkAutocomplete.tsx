import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";

interface WikiLinkAutocompleteProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  cursorPos: number;
  documents: { id: bigint; title: string }[];
  currentDocId: bigint;
  onSelect: (title: string, insertStart: number, insertEnd: number) => void;
  onDismiss: () => void;
}

// Detect unclosed [[ before cursor, return { query, start } or null
function detectWikiLink(content: string, cursorPos: number) {
  const before = content.slice(0, cursorPos);
  const openIdx = before.lastIndexOf("[[");
  if (openIdx === -1) return null;

  const afterOpen = before.slice(openIdx + 2);
  // If there's a ]] between [[ and cursor, it's already closed
  if (afterOpen.includes("]]")) return null;
  // If there's a newline in the query, it's not a valid link
  if (afterOpen.includes("\n")) return null;

  return { query: afterOpen, start: openIdx };
}

// Measure caret pixel position using a mirror div
function getCaretCoords(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number } {
  const mirror = document.createElement("div");
  const style = window.getComputedStyle(textarea);

  // Copy relevant styles
  const props = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "lineHeight",
    "textTransform",
    "wordSpacing",
    "textIndent",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "boxSizing",
    "width",
    "tabSize",
    "whiteSpace",
    "wordWrap",
    "overflowWrap",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.overflow = "hidden";
  mirror.style.height = "auto";

  for (const prop of props) {
    mirror.style[prop as string] = style[prop as string];
  }
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  const textBefore = textarea.value.slice(0, position);
  mirror.textContent = textBefore;

  const marker = document.createElement("span");
  marker.textContent = "\u200b"; // zero-width space
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  document.body.removeChild(mirror);

  return {
    top: markerRect.top - mirrorRect.top,
    left: markerRect.left - mirrorRect.left,
  };
}

export function WikiLinkAutocomplete({
  textareaRef,
  content,
  cursorPos,
  documents,
  currentDocId,
  onSelect,
  onDismiss,
}: WikiLinkAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const match = detectWikiLink(content, cursorPos);
  const query = match?.query ?? "";

  // Filter documents by query, exclude current doc
  const filtered = match
    ? documents
        .filter(
          (d) =>
            d.id !== currentDocId &&
            d.title.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : [];

  const isActive = match !== null && filtered.length > 0;

  // Reset selection when query or visibility changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isActive]);

  // Calculate position when active
  useEffect(() => {
    if (!isActive || !textareaRef.current) {
      setPosition(null);
      return;
    }
    const textarea = textareaRef.current;
    const coords = getCaretCoords(textarea, cursorPos);
    setPosition({
      top: coords.top - textarea.scrollTop + textarea.offsetTop,
      left: coords.left + textarea.offsetLeft,
    });
  }, [isActive, cursorPos, textareaRef]);

  // Keyboard handler — attached to textarea via capture
  useEffect(() => {
    if (!isActive) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const doc = filtered[selectedIndex];
        if (doc && match) {
          onSelect(doc.title, match.start, cursorPos);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [
    isActive,
    filtered,
    selectedIndex,
    match,
    cursorPos,
    onSelect,
    onDismiss,
    textareaRef,
  ]);

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return;
    const item = menuRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isActive || !position) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 rounded-md border border-border bg-popover shadow-md"
      style={{
        top: position.top + 24,
        left: Math.min(position.left, 200),
      }}
    >
      <ScrollArea className="max-h-48">
        <div className="p-1">
          {filtered.map((doc, idx) => (
            <button
              type="button"
              key={doc.id.toString()}
              data-index={idx}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                idx === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-popover-foreground hover:bg-accent/50",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                if (match) {
                  onSelect(doc.title, match.start, cursorPos);
                }
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
