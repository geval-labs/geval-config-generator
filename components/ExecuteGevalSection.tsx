"use client";

import { useState } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import type { AppState } from "@/lib/schemas";
import { buildContractYaml, buildPolicyYaml } from "@/lib/geval-yaml";
import type { GevalRunResponse } from "@/lib/run-geval-types";

type Props = {
  state: AppState;
  policyPaths: string[];
  signalsJson: string;
  onSignalsChange: (v: string) => void;
  validate: () => boolean;
};

export function ExecuteGevalSection({
  state,
  policyPaths,
  signalsJson,
  onSignalsChange,
  validate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GevalRunResponse | null>(null);

  async function run() {
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const policies = state.policies.map((p) => ({
        relativePath: p.path.replace(/^\/+/, "") || "policy.yaml",
        content: buildPolicyYaml(p),
      }));
      const contractYaml = buildContractYaml(state.contract, policyPaths);
      const res = await fetch("/api/geval/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractYaml,
          policies,
          signalsJson,
        }),
      });
      const data = (await res.json()) as GevalRunResponse;
      setResult(data);
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
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="p-5 border-b border-border/50 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-foreground">Run against Geval CLI</h3>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-xl">
            Requires the <span className="font-mono">geval</span> binary on the server (local
            <span className="font-mono"> npm run dev</span> or a host with Geval installed).
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/15"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Execute policy
        </button>
      </div>
      <div className="p-5 space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Signals JSON
        </label>
        <textarea
          className="w-full min-h-[120px] rounded-xl border border-border bg-[#0a0a0a] px-3 py-2.5 text-xs font-mono text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={signalsJson}
          onChange={(e) => onSignalsChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {result && (
        <div className="border-t border-border/50 p-5 space-y-3">
          {!result.ok ? (
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Run failed</p>
                <p className="text-destructive/90 mt-1">{result.error}</p>
                {result.stderr && (
                  <pre className="mt-2 text-xs text-destructive/70 whitespace-pre-wrap font-mono">
                    {result.stderr}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <OutcomeBadge outcome={result.outcome} />
                <span className="text-xs text-muted-foreground font-mono">
                  exit {result.exitCode}
                </span>
              </div>
              <pre className="text-[11px] font-mono leading-relaxed bg-[#0a0a0a] border border-border/50 rounded-xl p-4 overflow-x-auto text-foreground/80 max-h-[320px] overflow-y-auto">
                {JSON.stringify(result.json, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
