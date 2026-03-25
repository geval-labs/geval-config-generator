"use client";

import type { ContractForm as CF } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  value: CF;
  onChange: (v: CF) => void;
  fieldErrors?: { name?: string; version?: string };
};

export function ContractForm({ value, onChange, fieldErrors = {} }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Name and version identify this contract. Policies merge with{" "}
        <span className="font-mono text-foreground/90">worst_case</span> (BLOCK →
        require_approval → pass).
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80">
            Contract name
          </label>
          <input
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50",
              fieldErrors.name && "border-destructive/60 ring-1 ring-destructive/20",
            )}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="release-gate"
            aria-invalid={!!fieldErrors.name}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80">
            Version
          </label>
          <input
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50",
              fieldErrors.version && "border-destructive/60 ring-1 ring-destructive/20",
            )}
            value={value.version}
            onChange={(e) => onChange({ ...value, version: e.target.value })}
            placeholder="1.0.0"
            aria-invalid={!!fieldErrors.version}
          />
        </div>
      </div>
    </div>
  );
}
