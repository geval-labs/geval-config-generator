"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Download, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCcw,
  ExternalLink,
  Code2
} from "lucide-react";
import { ContractForm } from "@/components/ContractForm";
import { PolicyEditor } from "@/components/PolicyEditor";
import { YamlPreview } from "@/components/YamlPreview";
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
} from "@/lib/zip-download";
import { ZodError } from "zod";
import { cn } from "@/lib/utils";

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
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

  const parsed = useMemo(() => appStateSchema.safeParse(state), [state]);

  const policyPaths = useMemo(
    () => state.policies.map((p) => p.path.trim()),
    [state.policies],
  );

  const previewFiles = useMemo(() => {
    const files = [
      { 
        name: "contract.yaml", 
        content: buildContractYaml(state.contract, policyPaths),
        language: "yaml"
      }
    ];
    state.policies.forEach((p, i) => {
      files.push({
        name: p.path || `policy-${i + 1}.yaml`,
        content: buildPolicyYaml(p),
        language: "yaml"
      });
    });
    return files;
  }, [state, policyPaths]);

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

  async function handleDownloadZip() {
    if (!validate()) return;
    const files: { path: string; content: string }[] = [
      { path: "contract.yaml", content: buildContractYaml(state.contract, policyPaths) },
    ];
    for (const p of state.policies) {
      const rel = p.path.replace(/^\/+/, "");
      files.push({ path: rel || "policy.yaml", content: buildPolicyYaml(p) });
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
    <div className="min-h-screen">
      {/* Navigation / Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
      >
        <div className="mx-auto max-w-[1600px] glass border border-border/50 rounded-2xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Geval <span className="text-primary/80 font-medium text-sm hidden sm:inline">Config Generator</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              className={cn(
                "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                isPreviewCollapsed 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              title={isPreviewCollapsed ? "Expand Preview" : "Collapse Preview"}
            >
              <Code2 className="w-4 h-4" />
              <span>{isPreviewCollapsed ? "Show Result" : "Hide Result"}</span>
            </button>
            <div className="h-4 w-px bg-border/50 hidden lg:block" />
            <button
              onClick={() => setState(defaultAppState())}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
              title="Reset Form"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <a
              href="https://geval.io"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Master UI <ExternalLink className="w-3 h-3" />
            </a>
            <div className="h-4 w-px bg-border/50 hidden sm:block" />
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download ZIP</span>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-[1600px] px-6 pt-24 pb-24">
        <div className={cn(
          "grid grid-cols-1 gap-12 items-start transition-all duration-500 ease-in-out",
          isPreviewCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[1.5fr_1fr]"
        )}>
          {/* Left Column: Form */}
          <div className="space-y-12">
            {/* Global Errors */}
            <AnimatePresence>
              {lastError && lastError.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 flex gap-4"
                    role="alert"
                  >
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-destructive">Configuration Errors</p>
                      <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                        {lastError.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section 1: Contract */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary border border-border/50 font-bold text-primary">
                  01
                </div>
                <h3 className="text-xl font-bold">Release Contract</h3>
              </div>
              
              <motion.div 
                layout
                className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                <div className="p-6">
                  <ContractForm
                    value={state.contract}
                    onChange={(contract) => setState((s) => ({ ...s, contract }))}
                  />
                </div>
              </motion.div>
            </section>

            {/* Section 2: Policies */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary border border-border/50 font-bold text-primary">
                    02
                  </div>
                  <h3 className="text-xl font-bold">Enforcement Policies</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">{state.policies.length} Active Policies</span>
                  <button
                    type="button"
                    onClick={handleAddPolicy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border/50 rounded-lg text-xs font-semibold text-foreground transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Policy
                  </button>
                </div>
              </div>

              <div className="space-y-8 relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border/20 -z-10" />
                
                <AnimatePresence mode="popLayout" initial={false}>
                  {state.policies.map((policy, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="relative"
                    >
                      <PolicyEditor
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
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!isPreviewCollapsed && (
                  <div className="pt-8">
                     <button
                        type="button"
                        onClick={handleAddPolicy}
                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">Add Another Policy</span>
                      </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Preview */}
          <AnimatePresence mode="wait">
            {!isPreviewCollapsed && (
              <motion.aside 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:sticky lg:top-24 h-[calc(100vh-120px)] min-h-[600px] hidden lg:block"
              >
                <div className="flex flex-col h-full space-y-6">
                   <YamlPreview files={previewFiles} />
                   
                   {/* Quick Info */}
                   <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Code2 className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="text-sm font-bold">Quick Integration</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The output reflects your settings in real-time. Once satisfied, download the package.
                      </p>
                      <button
                        onClick={handleDownloadZip}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Configuration
                      </button>
                   </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-border/50 py-12 px-6 mt-12">
        <div className="mx-auto max-w-[1600px] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-widest text-foreground">Geval CLI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with precision for AI engineers.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/geval-labs/geval" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">GitHub</a>
            <a href="https://geval.io" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Docs</a>
          </div>
        </div>
      </footer>

      {/* Floating Toggle for Mobile or to show collapsed state */}
      <AnimatePresence>
        {isPreviewCollapsed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsPreviewCollapsed(false)}
            className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            title="Expand Preview"
          >
            <Code2 className="w-6 h-6" />
            <span className="absolute -top-12 right-0 bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Show YAML Result
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
