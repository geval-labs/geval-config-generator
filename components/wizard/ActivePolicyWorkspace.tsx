"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Globe,
  Layers,
  Plus,
  Save,
  X,
} from "lucide-react";
import type { PolicyForm, RuleForm } from "@/lib/schemas";
import { RuleRow } from "@/components/RuleRow";
import { cn } from "@/lib/utils";

type Props = {
  value: PolicyForm;
  onChange: (v: PolicyForm) => void;
  ruleDraft: RuleForm | null;
  ruleDraftEditIndex: number | null;
  onRuleDraftChange: (r: RuleForm) => void;
  onAddRule: () => void;
  onSaveRule: () => void;
  onCancelRuleDraft: () => void;
  onEditRule: (index: number) => void;
  onRemoveRule: (index: number) => void;
  onSavePolicy: () => void;
  onDiscardPolicy: () => void;
  policyFieldErrors: Record<string, string>;
  ruleDraftFieldErrors: Record<string, string>;
  /** Shown on saved rule rows when full-policy validation fails (e.g. duplicate priority). */
  savedRuleFieldErrors?: Record<number, Record<string, string>>;
};

export function ActivePolicyWorkspace({
  value,
  onChange,
  ruleDraft,
  ruleDraftEditIndex,
  onRuleDraftChange,
  onAddRule,
  onSaveRule,
  onCancelRuleDraft,
  onEditRule,
  onRemoveRule,
  onSavePolicy,
  onDiscardPolicy,
  policyFieldErrors,
  ruleDraftFieldErrors,
  savedRuleFieldErrors = {},
}: Props) {
  const canSavePolicy = value.rules.length >= 1 && value.path.trim().length > 0;

  return (
    <section className="rounded-2xl border border-primary/25 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-stretch border-b border-border/50">
        <div className="flex items-center justify-center w-12 shrink-0 bg-primary/10 border-r border-border/40">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 p-5">
          <h2 className="text-lg font-bold text-foreground">Current policy</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set the file path, then add and save rules one at a time. Save the policy when done.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Policy file path
          </label>
          <input
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20",
              policyFieldErrors.path && "border-destructive/60 ring-1 ring-destructive/20",
            )}
            value={value.path}
            onChange={(e) => onChange({ ...value, path: e.target.value })}
            placeholder="policy.yaml"
          />
          {policyFieldErrors.path && (
            <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3 h-3" /> {policyFieldErrors.path}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Rules in this policy
            </h4>
            {policyFieldErrors.rules && (
              <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {policyFieldErrors.rules}
              </p>
            )}
          </div>

          {value.rules.length > 0 && (
            <ul className="space-y-2">
              {value.rules.map((r, ri) => {
                const isEditing = ruleDraft !== null && ruleDraftEditIndex === ri;
                const rowIssues = savedRuleFieldErrors[ri];
                const rowHasError = rowIssues && Object.keys(rowIssues).length > 0;
                return (
                  <li
                    key={`${r.priority}-${r.name}-${ri}`}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-sm",
                      isEditing
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60 bg-secondary/20",
                      rowHasError && !isEditing && "border-destructive/50 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-6 shrink-0">
                        #{r.priority}
                      </span>
                      <span className="font-medium truncate">{r.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                        {r.metric} {r.operator}{" "}
                        {r.operator === "presence" ? "" : r.threshold}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => onEditRule(ri)}
                          className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                        >
                          Edit
                        </button>
                      )}
                      {isEditing && (
                        <span className="text-[10px] font-semibold text-primary flex items-center gap-1 px-2">
                          <Check className="w-3 h-3" /> Editing
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveRule(ri)}
                        className="text-xs font-semibold text-muted-foreground hover:text-destructive px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                    </div>
                    {rowHasError && !isEditing && (
                      <ul className="text-[10px] text-destructive pl-8 space-y-0.5 font-medium">
                        {Object.entries(rowIssues!).map(([k, msg]) => (
                          <li key={k}>
                            {k}: {msg}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <AnimatePresence mode="wait">
            {ruleDraft && (
              <motion.div
                key="draft"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl border border-dashed border-primary/35 bg-background/40 p-1"
              >
                <RuleRow
                  value={ruleDraft}
                  onChange={onRuleDraftChange}
                  onRemove={onCancelRuleDraft}
                  canRemove={false}
                  errors={ruleDraftFieldErrors}
                />
                <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                  <button
                    type="button"
                    onClick={onSaveRule}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {ruleDraftEditIndex !== null ? "Update rule" : "Save rule"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelRuleDraft}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!ruleDraft && (
            <button
              type="button"
              onClick={onAddRule}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add rule
            </button>
          )}
        </div>

        {(policyFieldErrors.path || policyFieldErrors.rules) && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Fix the highlighted fields above before saving this policy.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onSavePolicy}
            disabled={!canSavePolicy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-primary/15"
          >
            <Check className="w-4 h-4" />
            Save policy & pack
          </button>
          <button
            type="button"
            onClick={onDiscardPolicy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Discard policy
          </button>
        </div>
      </div>
    </section>
  );
}
