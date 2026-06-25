import { type MouseEvent, useCallback, useMemo, useRef } from "react";

declare global {
  interface Window {
    marked: {
      parse: (src: string, options?: { async?: false }) => string;
    };
  }
}

interface MarkdownPreviewProps {
  content: string;
  onNavigate: (title: string) => void;
}

// Convert [[wiki-links]] to clickable anchor tags before markdown parsing
function preprocessWikiLinks(content: string): string {
  return content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, title) =>
      `<a class="wikilink" data-wikilink="${title.replace(/"/g, "&quot;")}">${title}</a>`,
  );
}

export function MarkdownPreview({ content, onNavigate }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!window.marked) return content;
    const preprocessed = preprocessWikiLinks(content);
    return window.marked.parse(preprocessed, { async: false });
  }, [content]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const wikilink = target.closest<HTMLElement>("[data-wikilink]");
      if (wikilink) {
        e.preventDefault();
        const title = wikilink.getAttribute("data-wikilink");
        if (title) onNavigate(title);
      }
    },
    [onNavigate],
  );

  return (
    <div
      ref={containerRef}
      className="prose prose-sm dark:prose-invert max-w-none text-[15px] [&_.wikilink]:text-primary [&_.wikilink]:underline [&_.wikilink]:underline-offset-2 [&_.wikilink]:decoration-primary/40 [&_.wikilink]:cursor-pointer hover:[&_.wikilink]:decoration-primary"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as MouseEvent);
        }
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown rendered content
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
