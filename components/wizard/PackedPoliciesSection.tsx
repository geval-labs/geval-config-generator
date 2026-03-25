"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileCode, Pencil, Trash2, Shield } from "lucide-react";
import type { PolicyForm } from "@/lib/schemas";
type Props = {
  policies: PolicyForm[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
};

export function PackedPoliciesSection({ policies, onEdit, onDelete }: Props) {
  if (policies.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
        Saved policies
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        {policies.map((p, i) => (
          <motion.div
            key={`${p.path}-${i}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-border/80 bg-secondary/15 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shrink-0">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-foreground truncate">{p.path}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-3 h-3" />
                  {p.rules.length} rule{p.rules.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit policy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove policy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
