import { stringify } from "yaml";
import type { ContractForm, PolicyForm, RuleForm } from "./schemas";
import { COMBINE_RULE } from "./schemas";

function buildWhen(r: RuleForm): Record<string, unknown> {
  const w: Record<string, unknown> = {};
  if (r.component.trim()) w.component = r.component.trim();
  if (r.metric.trim()) w.metric = r.metric.trim();
  w.operator = r.operator;
  if (r.operator !== "presence") {
    w.threshold = Number(r.threshold);
  }
  return w;
}

function buildRule(r: RuleForm) {
  return {
    priority: r.priority,
    name: r.name.trim(),
    when: buildWhen(r),
    then: { action: r.action },
  };
}

/** Geval-compatible policy YAML (wrapped `policy:` block). */
export function buildPolicyYaml(p: PolicyForm): string {
  const doc: Record<string, unknown> = {
    policy: {
      rules: p.rules.map(buildRule),
    },
  };

  return stringify(doc, {
    lineWidth: 100,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}

export function buildContractYaml(
  c: ContractForm,
  policyPathsInOrder: string[],
): string {
  const combine = c.combine ?? COMBINE_RULE;
  const doc = {
    name: c.name.trim(),
    version: c.version.trim(),
    combine,
    policies: policyPathsInOrder.map((path) => ({ path: path.trim() })),
  };
  return stringify(doc, {
    lineWidth: 100,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}
