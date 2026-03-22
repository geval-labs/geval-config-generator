"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileCode, Trash2, Plus, AlertCircle, Settings2, Globe, Server } from "lucide-react";
import type { PolicyForm } from "@/lib/schemas";
import { defaultRule } from "@/lib/schemas";
import { RuleRow } from "./RuleRow";
import { cn } from "@/lib/utils";

type Props = {
  value: PolicyForm;
  index: number;
  onChange: (v: PolicyForm) => void;
  onRemove: () => void;
  canRemove: boolean;
  ruleErrors?: Record<number, Record<string, string>>;
  policyErrors?: Record<string, string>;
};

export function PolicyEditor({
  value,
  index,
  onChange,
  onRemove,
  canRemove,
  ruleErrors = {},
  policyErrors = {},
}: Props) {
  return (
    <div className="group relative pl-12">
      {/* Policy Number Badge */}
      <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border font-bold text-xs text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors z-10">
        {String(index + 1).padStart(2, '0')}
      </div>

      <section className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden hover:border-border/80 transition-colors shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-primary">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {value.name || `Policy ${index + 1}`}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  {value.path || "No path defined"}
                </p>
              </div>
            </div>
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> File Path
              </label>
              <input
                className={cn(
                  "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20",
                  policyErrors.path && "border-destructive/50 ring-destructive/10"
                )}
                value={value.path}
                onChange={(e) => onChange({ ...value, path: e.target.value })}
                placeholder="policies/security.yaml"
              />
              {policyErrors.path && (
                <p className="text-[10px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {policyErrors.path}
                </p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Settings2 className="w-3 h-3" /> Policy Name
              </label>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="Security Audit"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Server className="w-3 h-3" /> Env
              </label>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={value.environment}
                onChange={(e) => onChange({ ...value, environment: e.target.value })}
                placeholder="prod"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
                Rules & Signals
              </h4>
              {policyErrors.rules && (
                <p className="text-[10px] text-destructive flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {policyErrors.rules}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {value.rules.map((rule, ri) => (
                  <motion.div
                    key={ri}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <RuleRow
                      value={rule}
                      onChange={(r) => {
                        const next = [...value.rules];
                        next[ri] = r;
                        onChange({ ...value, rules: next });
                      }}
                      onRemove={() => {
                        const next = value.rules.filter((_, i) => i !== ri);
                        onChange({ ...value, rules: next });
                      }}
                      canRemove={value.rules.length > 1}
                      errors={ruleErrors[ri]}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => {
                const maxP = Math.max(...value.rules.map((r) => r.priority), 0);
                const next = defaultRule();
                next.priority = maxP + 1;
                onChange({
                  ...value,
                  rules: [...value.rules, next],
                });
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 rounded-2xl text-xs font-bold text-muted-foreground hover:text-primary transition-all group/add"
            >
              <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
              Add Enforcement Rule
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
