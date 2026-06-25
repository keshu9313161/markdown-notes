declare global {
  interface Window {
    JSZip: new () => JSZip;
  }
}

interface JSZip {
  file(name: string, data: string): void;
  generateAsync(options: { type: "blob" }): Promise<Blob>;
}

function sanitizeFilename(title: string): string {
  return title.replace(/[/\\?%*:|"<>]/g, "-");
}

function buildMarkdown(title: string, content: string): string {
  return `# ${title}\n\n${content}`;
}

export function exportDocument(title: string, content: string) {
  const filename = `${sanitizeFilename(title || "Untitled")}.md`;
  const markdown = buildMarkdown(title || "Untitled", content);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAllAsZip(
  documents: { title: string; content: string }[],
): Promise<void> {
  if (documents.length === 0) {
    throw new Error("No documents to export");
  }

  const zip = new window.JSZip();

  // Track filenames to avoid duplicates
  const usedNames = new Set<string>();

  for (const doc of documents) {
    let baseName = sanitizeFilename(doc.title || "Untitled");
    let filename = `${baseName}.md`;
    let counter = 1;
    while (usedNames.has(filename)) {
      filename = `${baseName} (${counter}).md`;
      counter += 1;
    }
    usedNames.add(filename);

    zip.file(filename, buildMarkdown(doc.title || "Untitled", doc.content));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storymesh-export.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
