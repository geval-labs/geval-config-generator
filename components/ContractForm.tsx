"use client";

import type { ContractForm as CF } from "@/lib/schemas";
import { combineRuleSchema } from "@/lib/schemas";

type Props = {
  value: CF;
  onChange: (v: CF) => void;
};

export function ContractForm({ value, onChange }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Contract
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Maps to Geval <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">contract.yaml</code>: name, version, combine rule, and policy paths (paths follow the order of policies below).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Version
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value.version}
            onChange={(e) => onChange({ ...value, version: e.target.value })}
            placeholder='e.g. "1.0.0"'
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
          Combine rule (how policies merge)
          <select
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
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
        </label>
      </div>
    </section>
  );
}
