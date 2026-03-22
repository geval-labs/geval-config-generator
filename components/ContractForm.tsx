"use client";

import type { ContractForm as CF } from "@/lib/schemas";
import { combineRuleSchema } from "@/lib/schemas";
import { Info } from "lucide-react";

type Props = {
  value: CF;
  onChange: (v: CF) => void;
};

export function ContractForm({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          The contract defines your environment and how multiple policies are combined to reach a final release decision.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            Contract Name
          </label>
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. main-release-gate"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80">
            Version
          </label>
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            value={value.version}
            onChange={(e) => onChange({ ...value, version: e.target.value })}
            placeholder='e.g. "1.0.0"'
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-foreground/80">
            Combine Rule
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              value={value.combine}
              onChange={(e) =>
                onChange({
                  ...value,
                  combine: combineRuleSchema.parse(e.target.value),
                })
              }
            >
              <option value="all_pass">all_pass — every policy must pass</option>
              <option value="any_block_blocks">
                any_block_blocks — any block wins; else approval; else pass
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground px-1">
            Determines how individual policy outcomes are reconciled into a single final decision.
          </p>
        </div>
      </div>
    </div>
  );
}
