"use client";

import { Check, Pencil, AlertCircle } from "lucide-react";
import { ContractForm } from "@/components/ContractForm";
import type { ContractForm as CF } from "@/lib/schemas";
type Props = {
  value: CF;
  onChange: (v: CF) => void;
  saved: boolean;
  onSave: () => void;
  onEdit: () => void;
  fieldErrors: Record<string, string>;
};

export function ContractBlock({
  value,
  onChange,
  saved,
  onSave,
  onEdit,
  fieldErrors,
}: Props) {
  const expanded = !saved;

  return (
    <section className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex items-center justify-center w-12 shrink-0 bg-secondary/30 border-r border-border/40 font-bold text-sm text-primary">
          1
        </div>
        <div className="flex-1 min-w-0">
          {expanded ? (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Contract</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Name and version for this gate
                </p>
              </div>
              <ContractForm
                value={value}
                onChange={onChange}
                fieldErrors={{
                  name: fieldErrors.name,
                  version: fieldErrors.version,
                }}
              />
              {(fieldErrors.name || fieldErrors.version) && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <ul className="space-y-1">
                    {fieldErrors.name && <li>Name: {fieldErrors.name}</li>}
                    {fieldErrors.version && <li>Version: {fieldErrors.version}</li>}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={onSave}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/15"
              >
                Save contract & continue
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground">Contract</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                  {value.name} · v{value.version}
                </p>
              </div>
              <span className="flex items-center gap-2 shrink-0 text-xs font-semibold text-primary">
                <Check className="w-4 h-4" />
                Saved
                <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
