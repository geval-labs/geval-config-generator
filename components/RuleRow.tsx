"use client";

import type { RuleForm } from "@/lib/schemas";
import { actionSchema, operatorSchema } from "@/lib/schemas";

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

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-950/50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Rule
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Remove rule
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Priority
          <input
            type="number"
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.priority}
            onChange={(e) =>
              onChange({ ...value, priority: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:col-span-2">
          Rule name
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
          {errors.name && (
            <span className="text-red-600 dark:text-red-400">{errors.name}</span>
          )}
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Metric
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.metric}
            onChange={(e) => onChange({ ...value, metric: e.target.value })}
          />
          {errors.metric && (
            <span className="text-red-600 dark:text-red-400">{errors.metric}</span>
          )}
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Component (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.component}
            onChange={(e) => onChange({ ...value, component: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          System (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.system}
            onChange={(e) => onChange({ ...value, system: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Agent (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.agent}
            onChange={(e) => onChange({ ...value, agent: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Step (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.step}
            onChange={(e) => onChange({ ...value, step: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Operator
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
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
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Threshold (not for presence)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.threshold}
            onChange={(e) => onChange({ ...value, threshold: e.target.value })}
            disabled={value.operator === "presence"}
            placeholder="e.g. 0.9"
          />
          {errors.threshold && (
            <span className="text-red-600 dark:text-red-400">
              {errors.threshold}
            </span>
          )}
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Action
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
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
        </label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:col-span-2 lg:col-span-4">
          Reason (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            value={value.reason}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
