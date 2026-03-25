import type { AppState, ContractForm, PolicyForm, RuleForm } from "./schemas";
import { COMBINE_RULE, defaultRule } from "./schemas";

/** Wizard-style editor: packed policies + optional in-progress policy + optional rule draft. */
export type EditorState = {
  contract: ContractForm;
  contractSaved: boolean;
  /** Completed policies (min 1 rule each). */
  packedPolicies: PolicyForm[];
  /** Policy currently being edited (may have 0+ rules). */
  activePolicy: PolicyForm | null;
  /**
   * Rule form in progress. When non-null, user is filling or editing one rule.
   * `editIndex` set when editing an existing rule in activePolicy.
   */
  ruleDraft: RuleForm | null;
  ruleDraftEditIndex: number | null;
};

export function defaultEditorState(): EditorState {
  return {
    contract: {
      name: "release-gate",
      version: "1.0.0",
      combine: COMBINE_RULE,
    },
    contractSaved: false,
    packedPolicies: [],
    activePolicy: null,
    ruleDraft: null,
    ruleDraftEditIndex: null,
  };
}

/** Build AppState for YAML preview / export (includes active policy if it has rules). */
export function editorToAppState(e: EditorState): AppState {
  const policies: PolicyForm[] = [...e.packedPolicies];
  if (
    e.activePolicy &&
    e.activePolicy.rules.length > 0 &&
    e.activePolicy.path.trim()
  ) {
    policies.push(e.activePolicy);
  }
  if (policies.length === 0) {
    policies.push({
      path: "policy.yaml",
      rules: [defaultRule()],
    });
  }
  return {
    contract: e.contract,
    policies,
  };
}

/** Strict AppState for download / execute: only packed + complete active (≥1 rule, valid path). */
export function editorToCompleteAppState(e: EditorState): AppState | null {
  const policies: PolicyForm[] = [...e.packedPolicies];
  if (
    e.activePolicy &&
    e.activePolicy.rules.length >= 1 &&
    e.activePolicy.path.trim()
  ) {
    policies.push(e.activePolicy);
  }
  if (policies.length === 0) return null;
  return {
    contract: e.contract,
    policies,
  };
}

export function nextDefaultPolicyPath(packedCount: number): string {
  return packedCount === 0 ? "policy.yaml" : `policies/gate-${packedCount + 1}.yaml`;
}
