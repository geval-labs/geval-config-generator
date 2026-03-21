import { stringify } from "yaml";
import type { ContractForm, PolicyForm, RuleForm } from "./schemas";

function buildWhen(r: RuleForm): Record<string, unknown> {
  const w: Record<string, unknown> = {};
  if (r.system.trim()) w.system = r.system.trim();
  if (r.agent.trim()) w.agent = r.agent.trim();
  if (r.component.trim()) w.component = r.component.trim();
  if (r.step.trim()) w.step = r.step.trim();
  if (r.metric.trim()) w.metric = r.metric.trim();
  w.operator = r.operator;
  if (r.operator !== "presence") {
    w.threshold = Number(r.threshold);
  }
  return w;
}

function buildRule(r: RuleForm) {
  const then: Record<string, unknown> = { action: r.action };
  if (r.reason.trim()) then.reason = r.reason.trim();
  return {
    priority: r.priority,
    name: r.name.trim(),
    when: buildWhen(r),
    then,
  };
}

/** Geval-compatible policy YAML (wrapped `policy:` block, like geval examples). */
export function buildPolicyYaml(p: PolicyForm): string {
  const policyInner: Record<string, unknown> = {
    rules: p.rules.map(buildRule),
  };
  if (p.environment.trim()) {
    policyInner.environment = p.environment.trim();
  }

  const doc: Record<string, unknown> = {
    policy: policyInner,
  };
  if (p.name.trim()) doc.name = p.name.trim();
  if (p.version.trim()) doc.version = p.version.trim();

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
  const doc = {
    name: c.name.trim(),
    version: c.version.trim(),
    combine: c.combine,
    policies: policyPathsInOrder.map((path) => ({ path: path.trim() })),
  };
  return stringify(doc, {
    lineWidth: 100,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}
