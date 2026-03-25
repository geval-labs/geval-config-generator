"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Download,
  AlertCircle,
  ShieldCheck,
  RefreshCcw,
  ExternalLink,
  Code2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { YamlPreview } from "@/components/YamlPreview";
import { ContractBlock } from "@/components/wizard/ContractBlock";
import { PackedPoliciesSection } from "@/components/wizard/PackedPoliciesSection";
import { ActivePolicyWorkspace } from "@/components/wizard/ActivePolicyWorkspace";
import {
  appStateSchema,
  contractFormSchema,
  defaultRule,
  policyFormSchema,
  ruleFormSchema,
  type AppState,
} from "@/lib/schemas";
import {
  defaultEditorState,
  editorToAppState,
  editorToCompleteAppState,
  nextDefaultPolicyPath,
  type EditorState,
} from "@/lib/editor-state";
import {
  policyFormIssuesSplit,
  zodIssuesToPathMap,
} from "@/lib/zod-field-errors";
import { buildContractYaml, buildPolicyYaml } from "@/lib/geval-yaml";
import { buildConfigZip, downloadBlob } from "@/lib/zip-download";
import { ZodError } from "zod";
import { cn } from "@/lib/utils";

function formatZodIssues(err: ZodError): string[] {
  return err.issues.map((i) => {
    const p = i.path.length ? i.path.join(".") : "form";
    return `${p}: ${i.message}`;
  });
}

function sanitizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "contract";
}

export default function Home() {
  const [editor, setEditor] = useState<EditorState>(() => defaultEditorState());
  const [savedContracts, setSavedContracts] = useState<AppState[]>([]);
  const [contractFieldErrors, setContractFieldErrors] = useState<
    Record<string, string>
  >({});
  const [policyFieldErrors, setPolicyFieldErrors] = useState<
    Record<string, string>
  >({});
  const [savedRuleFieldErrors, setSavedRuleFieldErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const [ruleDraftFieldErrors, setRuleDraftFieldErrors] = useState<
    Record<string, string>
  >({});
  const [lastError, setLastError] = useState<string[] | null>(null);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

  const previewState = useMemo(() => editorToAppState(editor), [editor]);
  const completeState = useMemo(() => editorToCompleteAppState(editor), [editor]);

  const exportContracts = useMemo(() => {
    if (completeState) return [...savedContracts, completeState];
    return savedContracts;
  }, [savedContracts, completeState]);

  const policyPaths = useMemo(() => {
    return previewState.policies.map((p) => p.path.trim());
  }, [previewState.policies]);

  const previewFiles = useMemo(() => {
    const files: { name: string; content: string; language: "yaml" }[] = [];
    const activeLabel = sanitizeName(previewState.contract.name || "active-contract");
    files.push({
      name: `${activeLabel}/contract.yaml`,
      content: buildContractYaml(previewState.contract, policyPaths),
      language: "yaml" as const,
    });
    previewState.policies.forEach((p, i) => {
      files.push({
        name: `${activeLabel}/${p.path || `policy-${i + 1}.yaml`}`,
        content: buildPolicyYaml(p),
        language: "yaml" as const,
      });
    });
    savedContracts.forEach((contract, ci) => {
      const root = `${String(ci + 1).padStart(2, "0")}-${sanitizeName(contract.contract.name || "contract")}`;
      const paths = contract.policies.map((p) => p.path.trim());
      files.push({
        name: `${root}/contract.yaml`,
        content: buildContractYaml(contract.contract, paths),
        language: "yaml" as const,
      });
      contract.policies.forEach((p, pi) => {
        files.push({
          name: `${root}/${p.path || `policy-${pi + 1}.yaml`}`,
          content: buildPolicyYaml(p),
          language: "yaml" as const,
        });
      });
    });
    return files;
  }, [previewState, policyPaths, savedContracts]);

  const validate = useCallback((): boolean => {
    const complete = editorToCompleteAppState(editor);
    if (!complete) {
      setLastError([
        "Finish the current contract: save at least one policy before downloading.",
      ]);
      return false;
    }
    const r = appStateSchema.safeParse(complete);
    if (r.success) {
      setLastError(null);
      return true;
    }
    setLastError(formatZodIssues(r.error));
    return false;
  }, [editor]);

  async function handleDownloadZip() {
    if (savedContracts.length === 0 && !validate()) return;
    const contracts = exportContracts;
    if (contracts.length === 0) return;
    const files: { path: string; content: string }[] = [];
    contracts.forEach((contract, ci) => {
      const root = `${String(ci + 1).padStart(2, "0")}-${sanitizeName(contract.contract.name || "contract")}`;
      const paths = contract.policies.map((p) => p.path.trim());
      files.push({
        path: `${root}/contract.yaml`,
        content: buildContractYaml(contract.contract, paths),
      });
      contract.policies.forEach((p) => {
        const rel = p.path.replace(/^\/+/, "");
        files.push({
          path: `${root}/${rel || "policy.yaml"}`,
          content: buildPolicyYaml(p),
        });
      });
    });
    const blob = await buildConfigZip(files);
    downloadBlob(blob, "geval-contracts.zip");
  }

  function handleSaveContract() {
    const r = contractFormSchema.safeParse(editor.contract);
    if (!r.success) {
      const m = zodIssuesToPathMap(r.error);
      setContractFieldErrors({
        ...(m.name ? { name: m.name } : {}),
        ...(m.version ? { version: m.version } : {}),
      });
      return;
    }
    setContractFieldErrors({});
    setEditor((e) => ({ ...e, contractSaved: true }));
  }

  function handleEditContract() {
    setEditor((e) => ({ ...e, contractSaved: false }));
  }

  function handleAddPolicy() {
    if (editor.activePolicy) return;
    setEditor((e) => ({
      ...e,
      activePolicy: {
        path: nextDefaultPolicyPath(e.packedPolicies.length),
        rules: [],
      },
      ruleDraft: null,
      ruleDraftEditIndex: null,
    }));
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setRuleDraftFieldErrors({});
  }

  function handleDiscardActivePolicy() {
    setEditor((e) => ({
      ...e,
      activePolicy: null,
      ruleDraft: null,
      ruleDraftEditIndex: null,
    }));
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setRuleDraftFieldErrors({});
  }

  function handleSavePolicy() {
    if (!editor.activePolicy) return;
    const r = policyFormSchema.safeParse(editor.activePolicy);
    if (!r.success) {
      const { policyFields, ruleFields } = policyFormIssuesSplit(r.error);
      setPolicyFieldErrors(policyFields);
      setSavedRuleFieldErrors(ruleFields);
      return;
    }
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setEditor((e) => ({
      ...e,
      packedPolicies: [...e.packedPolicies, e.activePolicy!],
      activePolicy: null,
      ruleDraft: null,
      ruleDraftEditIndex: null,
    }));
  }

  function handleEditPackedPolicy(index: number) {
    setEditor((e) => {
      if (e.activePolicy) return e;
      const p = e.packedPolicies[index];
      const rest = e.packedPolicies.filter((_, j) => j !== index);
      return {
        ...e,
        packedPolicies: rest,
        activePolicy: p,
        ruleDraft: null,
        ruleDraftEditIndex: null,
      };
    });
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setRuleDraftFieldErrors({});
  }

  function handleDeletePackedPolicy(index: number) {
    setEditor((e) => ({
      ...e,
      packedPolicies: e.packedPolicies.filter((_, j) => j !== index),
    }));
  }

  function handleAddRule() {
    if (!editor.activePolicy) return;
    const nextP =
      editor.activePolicy.rules.length > 0
        ? Math.max(...editor.activePolicy.rules.map((r) => r.priority)) + 1
        : 1;
    const dr = defaultRule();
    dr.priority = nextP;
    setRuleDraftFieldErrors({});
    setEditor((e) => ({
      ...e,
      ruleDraft: dr,
      ruleDraftEditIndex: null,
    }));
  }

  function handleSaveRule() {
    if (!editor.ruleDraft || !editor.activePolicy) return;
    const r = ruleFormSchema.safeParse(editor.ruleDraft);
    if (!r.success) {
      setRuleDraftFieldErrors(zodIssuesToPathMap(r.error));
      return;
    }
    const draft = editor.ruleDraft;
    const editIdx = editor.ruleDraftEditIndex;
    const dup = editor.activePolicy.rules.some(
      (rule, i) =>
        i !== (editIdx ?? -1) && rule.priority === draft.priority,
    );
    if (dup) {
      setRuleDraftFieldErrors({
        priority: "Duplicate priority in this policy",
      });
      return;
    }
    setRuleDraftFieldErrors({});
    setSavedRuleFieldErrors({});
    setEditor((e) => {
      const ap = e.activePolicy!;
      const idx = e.ruleDraftEditIndex;
      let rules = [...ap.rules];
      if (idx !== null) rules[idx] = draft;
      else rules = [...rules, draft];
      return {
        ...e,
        activePolicy: { ...ap, rules },
        ruleDraft: null,
        ruleDraftEditIndex: null,
      };
    });
  }

  function handleCancelRuleDraft() {
    setRuleDraftFieldErrors({});
    setEditor((e) => ({
      ...e,
      ruleDraft: null,
      ruleDraftEditIndex: null,
    }));
  }

  function handleEditRule(index: number) {
    if (!editor.activePolicy) return;
    setRuleDraftFieldErrors({});
    setEditor((e) => ({
      ...e,
      ruleDraft: { ...e.activePolicy!.rules[index] },
      ruleDraftEditIndex: index,
    }));
  }

  function handleRemoveRule(index: number) {
    setSavedRuleFieldErrors({});
    setEditor((e) => {
      const ap = e.activePolicy!;
      const rules = ap.rules.filter((_, j) => j !== index);
      let ruleDraft = e.ruleDraft;
      let ruleDraftEditIndex = e.ruleDraftEditIndex;
      if (ruleDraftEditIndex === index) {
        ruleDraft = null;
        ruleDraftEditIndex = null;
      } else if (ruleDraftEditIndex !== null && ruleDraftEditIndex > index) {
        ruleDraftEditIndex = ruleDraftEditIndex - 1;
      }
      return {
        ...e,
        activePolicy: { ...ap, rules },
        ruleDraft,
        ruleDraftEditIndex,
      };
    });
  }

  function resetAll() {
    setEditor(defaultEditorState());
    setSavedContracts([]);
    setContractFieldErrors({});
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setRuleDraftFieldErrors({});
    setLastError(null);
  }

  function handleFinalizeContract() {
    if (editor.activePolicy || editor.ruleDraft) {
      setLastError([
        "Finish or discard the policy in progress before packing this contract.",
      ]);
      return;
    }
    const complete = editorToCompleteAppState(editor);
    if (!complete) {
      setLastError([
        "Add and save at least one policy before packing this contract.",
      ]);
      return;
    }
    const r = appStateSchema.safeParse(complete);
    if (!r.success) {
      setLastError(formatZodIssues(r.error));
      return;
    }
    setSavedContracts((s) => [...s, complete]);
    setEditor(defaultEditorState());
    setContractFieldErrors({});
    setPolicyFieldErrors({});
    setSavedRuleFieldErrors({});
    setRuleDraftFieldErrors({});
    setLastError(null);
  }

  function handleRemoveSavedContract(index: number) {
    setSavedContracts((s) => s.filter((_, i) => i !== index));
  }

  function handleEditSavedContract(index: number) {
    const isDirty =
      editor.contractSaved ||
      editor.packedPolicies.length > 0 ||
      !!editor.activePolicy ||
      !!editor.ruleDraft;
    if (isDirty) {
      setLastError([
        "Pack or reset the current contract before editing a saved one.",
      ]);
      return;
    }
    const target = savedContracts[index];
    if (!target) return;
    setSavedContracts((s) => s.filter((_, i) => i !== index));
    setEditor({
      contract: target.contract,
      contractSaved: true,
      packedPolicies: [...target.policies],
      activePolicy: null,
      ruleDraft: null,
      ruleDraftEditIndex: null,
    });
    setLastError(null);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader>
        <button
          onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
          className={cn(
            "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            isPreviewCollapsed
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5",
          )}
          title={isPreviewCollapsed ? "Expand preview" : "Collapse preview"}
          type="button"
        >
          <Code2 className="w-4 h-4" />
          <span>{isPreviewCollapsed ? "Show YAML" : "Hide YAML"}</span>
        </button>
        <button
          onClick={resetAll}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
          title="Reset form"
          type="button"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
        <a
          href="https://geval.io"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Docs <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={handleDownloadZip}
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download ZIP</span>
        </button>
      </SiteHeader>

      <main className="mx-auto max-w-[1600px] px-6 pt-24 pb-24">
        <div
          className={cn(
            "grid grid-cols-1 gap-12 items-start transition-all duration-500 ease-in-out",
            isPreviewCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[1.5fr_1fr]",
          )}
        >
          <div className="space-y-10">
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
                      <p className="font-bold text-destructive">Configuration errors</p>
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

            <ContractBlock
              value={editor.contract}
              onChange={(contract) => {
                setContractFieldErrors({});
                setEditor((e) => ({ ...e, contract }));
              }}
              saved={editor.contractSaved}
              onSave={handleSaveContract}
              onEdit={handleEditContract}
              fieldErrors={contractFieldErrors}
            />

            {editor.contractSaved && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary border border-border/50 font-bold text-primary">
                        2
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Policies</h3>
                        <p className="text-xs text-muted-foreground">
                          One policy file at a time — save and pack before adding another.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {editor.packedPolicies.length} saved
                      {editor.activePolicy ? " · 1 in progress" : ""}
                    </span>
                  </div>

                  <PackedPoliciesSection
                    policies={editor.packedPolicies}
                    onEdit={handleEditPackedPolicy}
                    onDelete={handleDeletePackedPolicy}
                  />

                  {editor.activePolicy && (
                    <ActivePolicyWorkspace
                      value={editor.activePolicy}
                      onChange={(p) => {
                        setPolicyFieldErrors((prev) => ({
                          ...prev,
                          path: "",
                        }));
                        setSavedRuleFieldErrors({});
                        setEditor((e) => ({ ...e, activePolicy: p }));
                      }}
                      ruleDraft={editor.ruleDraft}
                      ruleDraftEditIndex={editor.ruleDraftEditIndex}
                      onRuleDraftChange={(r) => {
                        setRuleDraftFieldErrors({});
                        setEditor((e) => ({ ...e, ruleDraft: r }));
                      }}
                      onAddRule={handleAddRule}
                      onSaveRule={handleSaveRule}
                      onCancelRuleDraft={handleCancelRuleDraft}
                      onEditRule={handleEditRule}
                      onRemoveRule={handleRemoveRule}
                      onSavePolicy={handleSavePolicy}
                      onDiscardPolicy={handleDiscardActivePolicy}
                      policyFieldErrors={policyFieldErrors}
                      ruleDraftFieldErrors={ruleDraftFieldErrors}
                      savedRuleFieldErrors={savedRuleFieldErrors}
                    />
                  )}

                  {!editor.activePolicy && (
                    <button
                      type="button"
                      onClick={handleAddPolicy}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">Add policy file</span>
                    </button>
                  )}

                  <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      When this contract is complete, pack it and start a new one.
                    </p>
                    <button
                      type="button"
                      onClick={handleFinalizeContract}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
                    >
                      Pack contract
                    </button>
                  </div>
                </section>
              </>
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Packed contracts</h3>
                <span className="text-xs text-muted-foreground">
                  {savedContracts.length} ready
                </span>
              </div>
              {savedContracts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground">
                  No packed contracts yet.
                </div>
              )}
              {savedContracts.map((contract, idx) => (
                <div
                  key={`${contract.contract.name}-${contract.contract.version}-${idx}`}
                  className="rounded-xl border border-border/70 bg-card px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contract.contract.name} · v{contract.contract.version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contract.policies.length}{" "}
                      {contract.policies.length === 1 ? "policy" : "policies"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditSavedContract(idx)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedContract(idx)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>

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
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Code2 className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="text-sm font-bold">YAML preview</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Unique priorities per policy; lowest number wins among matches.{" "}
                      <span className="font-mono">worst_case</span> merges policy outcomes by
                      severity.
                    </p>
                    <button
                      onClick={handleDownloadZip}
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download ZIP
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
            <span className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Geval
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Policy-as-code for AI releases.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/geval-labs/geval"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              GitHub
            </a>
            <a
              href="/run"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Run policy
            </a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isPreviewCollapsed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsPreviewCollapsed(false)}
            className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all lg:hidden"
            title="Show YAML"
            type="button"
          >
            <Code2 className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
