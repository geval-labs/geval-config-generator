"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FileCode, ChevronDown, ChevronRight, Terminal } from "lucide-react";

type PreviewFile = {
  name: string;
  content: string;
  language: string;
};

type Props = {
  files: PreviewFile[];
};

export function YamlPreview({ files }: Props) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    return files.reduce((acc, f) => ({ ...acc, [f.name]: true }), {});
  });

  // Automatically expand new files
  useEffect(() => {
    setExpandedFiles(prev => {
      const next = { ...prev };
      let changed = false;
      files.forEach(f => {
        if (next[f.name] === undefined) {
          next[f.name] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [files]);

  const toggleExpand = (name: string) => {
    setExpandedFiles(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCopy = async (file: PreviewFile) => {
    await navigator.clipboard.writeText(file.content);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {files.map((file) => {
          const isExpanded = expandedFiles[file.name];
          const isCopied = copiedFile === file.name;

          return (
            <div 
              key={file.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <div
                onClick={() => toggleExpand(file.name)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <FileCode className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-mono font-medium text-foreground/80">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(file);
                    }}
                    className="p-1.5 hover:bg-primary/20 rounded-md transition-colors group"
                    title="Copy to clipboard"
                   >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    )}
                   </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-foreground/70 selection:bg-primary/30">
                      <pre className="whitespace-pre">
                        {file.content || "# No content"}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
