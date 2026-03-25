"use client";

import { Trash2, Shield, Activity, Layers, ChevronDown, AlertCircle } from "lucide-react";
import { actionSchema, operatorSchema, type RuleForm } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  value: RuleForm;
  onChange: (v: RuleForm) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors?: Record<string, string>;
};

export function RuleRow({
  value,
  onChange,
  onRemove,
  canRemove,
  errors = {},
}: Props) {
  const ops = operatorSchema.options;
  const actions = actionSchema.options;

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40";
  const labelClass =
    "text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-1";

  return (
    <div className="relative group/row rounded-2xl border border-border/50 bg-secondary/20 p-5 hover:bg-secondary/30 hover:border-border transition-all">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-12 items-end">
          <div className="sm:col-span-2 space-y-1">
            <label className={labelClass}>
              <Layers className="w-3 h-3" /> Priority
            </label>
            <input
              type="number"
              className={cn(
                inputClass,
                errors.priority && "border-destructive/50 ring-destructive/10",
              )}
              value={value.priority}
              onChange={(e) =>
                onChange({ ...value, priority: Number(e.target.value) || 1 })
              }
            />
            <p className="text-[9px] text-muted-foreground mt-1 leading-tight">
              1 = highest; unique per policy.
            </p>
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className={labelClass}>
              <Shield className="w-3 h-3" /> Rule name
            </label>
            <input
              className={cn(
                inputClass,
                errors.name && "border-destructive/50 ring-destructive/10",
              )}
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder="hallucination_guard"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className={labelClass}>Action</label>
            <div className="relative">
              <select
                className={cn(inputClass, "appearance-none")}
                value={value.action}
                onChange={(e) =>
                  onChange({
                    ...value,
                    action: actionSchema.parse(e.target.value),
                  })
                }
              >
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                aria-label="Remove rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-12 items-end border-t border-border/30 pt-4">
          <div className="space-y-1 sm:col-span-4">
            <label className={labelClass}>
              <Activity className="w-3 h-3" /> Metric
            </label>
            <input
              className={cn(
                inputClass,
                errors.metric && "border-destructive/50 ring-destructive/10",
              )}
              value={value.metric}
              onChange={(e) => onChange({ ...value, metric: e.target.value })}
              placeholder="hallucination_rate"
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className={labelClass}>Component (optional)</label>
            <input
              className={inputClass}
              value={value.component}
              onChange={(e) =>
                onChange({ ...value, component: e.target.value })
              }
              placeholder="generator"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>Operator</label>
            <div className="relative">
              <select
                className={cn(inputClass, "appearance-none font-mono")}
                value={value.operator}
                onChange={(e) =>
                  onChange({
                    ...value,
                    operator: operatorSchema.parse(e.target.value),
                  })
                }
              >
                {ops.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className={labelClass}>Threshold</label>
            <input
              className={cn(
                inputClass,
                errors.threshold && "border-destructive/50 ring-destructive/10",
              )}
              value={value.threshold}
              onChange={(e) =>
                onChange({ ...value, threshold: e.target.value })
              }
              disabled={value.operator === "presence"}
              placeholder="0.05"
            />
          </div>
        </div>
      </div>

      {(errors.priority ||
        errors.name ||
        errors.metric ||
        errors.threshold) && (
        <div className="mt-3 flex items-center gap-2 text-[10px] text-destructive font-medium border-t border-destructive/20 pt-2">
          <AlertCircle className="w-3 h-3" />
          <span>
            {errors.priority ??
              errors.name ??
              errors.metric ??
              errors.threshold ??
              "Fix this rule"}
          </span>
        </div>
      )}
    </div>
  );
}
