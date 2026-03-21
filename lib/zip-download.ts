import JSZip from "jszip";

export async function buildConfigZip(files: {
  path: string;
  content: string;
}[]): Promise<Blob> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.path.replace(/^\/+/, ""), f.content);
  }
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8" });
  downloadBlob(blob, filename);
}
