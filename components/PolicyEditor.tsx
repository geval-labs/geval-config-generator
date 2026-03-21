"use client";

import type { PolicyForm } from "@/lib/schemas";
import { defaultRule } from "@/lib/schemas";
import { RuleRow } from "./RuleRow";

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
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Policy {index + 1}
        </h2>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Remove policy
          </button>
        )}
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          File path (in repo, relative to contract)
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.path}
            onChange={(e) => onChange({ ...value, path: e.target.value })}
            placeholder="policy.yaml or policies/security.yaml"
          />
          {policyErrors.path && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {policyErrors.path}
            </span>
          )}
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Policy name (optional, audit)
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Policy version (optional)
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.version}
            onChange={(e) => onChange({ ...value, version: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Environment (optional)
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.environment}
            onChange={(e) => onChange({ ...value, environment: e.target.value })}
            placeholder="prod"
          />
        </label>
      </div>
      {policyErrors.rules && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">
          {policyErrors.rules}
        </p>
      )}
      <div className="space-y-3">
        {value.rules.map((rule, ri) => (
          <RuleRow
            key={ri}
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
        ))}
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
        className="mt-4 rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Add rule
      </button>
    </section>
  );
}
