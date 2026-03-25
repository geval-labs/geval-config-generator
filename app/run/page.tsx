"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Play, Loader2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { DEFAULT_SIGNALS_JSON } from "@/lib/default-signals";
import type { GevalRunResponse } from "@/lib/run-geval-types";
const CONTRACT_START = `name: release-gate
version: "1.0.0"
combine: worst_case
policies:
  - path: policy.yaml
`;

const POLICY_START = `policy:
  rules:
    - priority: 1
      name: sample
      when:
        metric: accuracy
        operator: ">="
        threshold: 0.9
      then:
        action: pass
`;

type PolicySlot = { path: string; content: string };

export default function RunPolicyPage() {
  const [contractYaml, setContractYaml] = useState(CONTRACT_START);
  const [policies, setPolicies] = useState<PolicySlot[]>([
    { path: "policy.yaml", content: POLICY_START },
  ]);
  const [signalsJson, setSignalsJson] = useState(DEFAULT_SIGNALS_JSON);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GevalRunResponse | null>(null);

  const canRun = useMemo(
    () =>
      contractYaml.trim().length > 0 &&
      signalsJson.trim().length > 0 &&
      policies.every((p) => p.path.trim() && p.content.trim()),
    [contractYaml, signalsJson, policies],
  );

  async function run() {
    if (!canRun) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/geval/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractYaml,
          policies: policies.map((p) => ({
            relativePath: p.path.replace(/^\/+/, ""),
            content: p.content,
          })),
          signalsJson,
        }),
      });
      setResult((await res.json()) as GevalRunResponse);
    } catch (e) {
      setResult({
        ok: false,
        error: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-bold tracking-tight">Run policy</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Paste a contract, one or more policy files, and signals JSON. Geval runs on the server
            where this app is hosted — use{" "}
            <span className="font-mono text-foreground/80">npm run dev</span> locally with the CLI
            on your PATH.
          </p>
        </motion.div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">contract.yaml</h2>
            <textarea
              className="w-full min-h-[160px] rounded-xl border border-border bg-[#0a0a0a] px-3 py-2.5 text-xs font-mono text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={contractYaml}
              onChange={(e) => setContractYaml(e.target.value)}
              spellCheck={false}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Policy files</h2>
              <button
                type="button"
                onClick={() =>
                  setPolicies((p) => [
                    ...p,
                    {
                      path: `policy-${p.length + 1}.yaml`,
                      content: POLICY_START,
                    },
                  ])
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add policy file
              </button>
            </div>
            {policies.map((slot, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5 space-y-3"
              >
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Path (as referenced by contract)
                    </label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
                      value={slot.path}
                      onChange={(e) => {
                        const next = [...policies];
                        next[i] = { ...next[i], path: e.target.value };
                        setPolicies(next);
                      }}
                    />
                  </div>
                  {policies.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPolicies((p) => p.filter((_, j) => j !== i))
                      }
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                      aria-label="Remove policy file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full min-h-[200px] rounded-xl border border-border bg-[#0a0a0a] px-3 py-2.5 text-xs font-mono text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={slot.content}
                  onChange={(e) => {
                    const next = [...policies];
                    next[i] = { ...next[i], content: e.target.value };
                    setPolicies(next);
                  }}
                  spellCheck={false}
                />
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">signals.json</h2>
            <textarea
              className="w-full min-h-[140px] rounded-xl border border-border bg-[#0a0a0a] px-3 py-2.5 text-xs font-mono text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={signalsJson}
              onChange={(e) => setSignalsJson(e.target.value)}
              spellCheck={false}
            />
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canRun || loading}
              onClick={run}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Geval
            </button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border bg-card/60 p-6"
            >
              {!result.ok ? (
                <div className="flex gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm mt-1">{result.error}</p>
                    {result.stderr && (
                      <pre className="mt-3 text-xs font-mono whitespace-pre-wrap opacity-90">
                        {result.stderr}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <OutcomeBadge outcome={result.outcome} />
                    <span className="text-xs text-muted-foreground font-mono">
                      exit {result.exitCode}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono leading-relaxed bg-[#0a0a0a] border border-border/50 rounded-xl p-4 overflow-x-auto text-foreground/80 max-h-[400px] overflow-y-auto">
                    {JSON.stringify(result.json, null, 2)}
                  </pre>
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
