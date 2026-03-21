"use client";

import { useMemo, useState } from "react";
import { ContractForm } from "@/components/ContractForm";
import { PolicyEditor } from "@/components/PolicyEditor";
import {
  appStateSchema,
  defaultAppState,
  defaultPolicy,
  type AppState,
} from "@/lib/schemas";
import { buildContractYaml, buildPolicyYaml } from "@/lib/geval-yaml";
import {
  buildConfigZip,
  downloadBlob,
  downloadText,
} from "@/lib/zip-download";
import { ZodError } from "zod";

function formatZodIssues(err: ZodError): string[] {
  return err.issues.map((i) => {
    const p = i.path.length ? i.path.join(".") : "form";
    return `${p}: ${i.message}`;
  });
}

function rulePolicyErrors(err: ZodError): {
  global: string[];
  byPolicy: Record<number, Record<number, Record<string, string>>>;
  policyFields: Record<number, Record<string, string>>;
} {
  const global: string[] = [];
  const byPolicy: Record<number, Record<number, Record<string, string>>> = {};
  const policyFields: Record<number, Record<string, string>> = {};

  for (const issue of err.issues) {
    const path = issue.path;
    if (path[0] === "contract") {
      global.push(`contract.${path.slice(1).join(".")}: ${issue.message}`);
      continue;
    }
    if (path[0] === "policies" && typeof path[1] === "number") {
      const pi = path[1] as number;
      if (path[2] === "path" || path[2] === "rules") {
        if (path[2] === "path") {
          policyFields[pi] = policyFields[pi] || {};
          policyFields[pi].path = issue.message;
        }
        if (path[2] === "rules" && path.length === 3) {
          policyFields[pi] = policyFields[pi] || {};
          policyFields[pi].rules = issue.message;
        }
        if (path[2] === "rules" && typeof path[3] === "number") {
          const ri = path[3] as number;
          const field = path[4] as string | undefined;
          if (field) {
            byPolicy[pi] = byPolicy[pi] || {};
            byPolicy[pi][ri] = byPolicy[pi][ri] || {};
            byPolicy[pi][ri][field] = issue.message;
          }
        }
      }
    }
  }
  return { global, byPolicy, policyFields };
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => defaultAppState());
  const [lastError, setLastError] = useState<string[] | null>(null);

  const parsed = useMemo(() => appStateSchema.safeParse(state), [state]);

  const policyPaths = useMemo(
    () => state.policies.map((p) => p.path.trim()),
    [state.policies],
  );

  const errorDetails = useMemo(() => {
    if (parsed.success) return null;
    return rulePolicyErrors(parsed.error);
  }, [parsed]);

  function validate(): boolean {
    const r = appStateSchema.safeParse(state);
    if (r.success) {
      setLastError(null);
      return true;
    }
    setLastError(formatZodIssues(r.error));
    return false;
  }

  function handleDownloadContract() {
    if (!validate()) return;
    const yaml = buildContractYaml(state.contract, policyPaths);
    downloadText(yaml, "contract.yaml");
  }

  function handleDownloadPolicy(i: number) {
    if (!validate()) return;
    const name = state.policies[i].path.split("/").pop() || `policy-${i}.yaml`;
    const yaml = buildPolicyYaml(state.policies[i]);
    downloadText(yaml, name);
  }

  async function copyContractYaml() {
    if (!validate()) return;
    const yaml = buildContractYaml(state.contract, policyPaths);
    await navigator.clipboard.writeText(yaml);
  }

  async function copyPolicyYaml(i: number) {
    if (!validate()) return;
    await navigator.clipboard.writeText(buildPolicyYaml(state.policies[i]));
  }

  async function handleDownloadZip() {
    if (!validate()) return;
    const files: { path: string; content: string }[] = [
      { path: "contract.yaml", content: buildContractYaml(state.contract, policyPaths) },
    ];
    for (const p of state.policies) {
      const rel = p.path.replace(/^\/+/, "");
      files.push({ path: rel, content: buildPolicyYaml(p) });
    }
    const blob = await buildConfigZip(files);
    downloadBlob(blob, "geval-config.zip");
  }

  function handleAddPolicy() {
    setState((s) => ({
      ...s,
      policies: [...s.policies, defaultPolicy(s.policies.length)],
    }));
  }

  function handleRemovePolicy(i: number) {
    setState((s) => ({
      ...s,
      policies: s.policies.filter((_, j) => j !== i),
    }));
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Geval config generator
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Build <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">contract.yaml</code>{" "}
              and policy YAML for the{" "}
              <a
                href="https://github.com/geval/geval"
                className="text-emerald-700 underline dark:text-emerald-400"
                target="_blank"
                rel="noreferrer"
              >
                Geval
              </a>{" "}
              CLI. Validate locally with{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                geval validate-contract
              </code>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setState(defaultAppState())}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={validate}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Validate
            </button>
            <button
              type="button"
              onClick={copyContractYaml}
              className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              Copy contract YAML
            </button>
            <button
              type="button"
              onClick={handleDownloadContract}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Download contract.yaml
            </button>
            <button
              type="button"
              onClick={handleDownloadZip}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Download ZIP
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {lastError && lastError.length > 0 && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            <p className="font-semibold">Fix the following:</p>
            <ul className="mt-2 list-inside list-disc">
              {lastError.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <ContractForm
          value={state.contract}
          onChange={(contract) => setState((s) => ({ ...s, contract }))}
        />

        <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <strong>Policy paths in contract</strong> (order matches policies below):
          <ol className="mt-2 list-inside list-decimal font-mono text-xs">
            {policyPaths.map((p, i) => (
              <li key={i}>{p || "(empty)"}</li>
            ))}
          </ol>
        </div>

        {state.policies.map((policy, i) => (
          <PolicyEditor
            key={i}
            value={policy}
            index={i}
            onChange={(p) =>
              setState((s) => ({
                ...s,
                policies: s.policies.map((x, j) => (j === i ? p : x)),
              }))
            }
            onRemove={() => handleRemovePolicy(i)}
            canRemove={state.policies.length > 1}
            ruleErrors={
              parsed.success ? undefined : errorDetails?.byPolicy[i]
            }
            policyErrors={
              parsed.success ? undefined : errorDetails?.policyFields[i]
            }
          />
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddPolicy}
            className="rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white dark:border-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            + Add policy
          </button>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Per-policy download
          </h2>
          <div className="flex flex-wrap gap-2">
            {state.policies.map((p, i) => (
              <span key={i} className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyPolicyYaml(i)}
                  className="rounded-lg border border-zinc-400 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Copy {p.path.split("/").pop() || `policy-${i}`}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPolicy(i)}
                  className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                >
                  Download {p.path.split("/").pop() || `policy-${i}.yaml`}
                </button>
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
