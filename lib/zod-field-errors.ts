import { ZodError } from "zod";

/** Policy-level fields plus per-rule field errors from `policyFormSchema` parse failure. */
export function policyFormIssuesSplit(err: ZodError): {
  policyFields: Record<string, string>;
  ruleFields: Record<number, Record<string, string>>;
} {
  const policyFields: Record<string, string> = {};
  const ruleFields: Record<number, Record<string, string>> = {};
  for (const issue of err.issues) {
    const path = issue.path;
    if (path[0] === "path") {
      policyFields.path = issue.message;
      continue;
    }
    if (path[0] === "rules" && path.length === 1) {
      policyFields.rules = issue.message;
      continue;
    }
    if (path[0] === "rules" && typeof path[1] === "number") {
      const ri = path[1] as number;
      const field = path[2];
      if (typeof field === "string") {
        ruleFields[ri] = ruleFields[ri] || {};
        ruleFields[ri][field] = issue.message;
      }
    }
  }
  return { policyFields, ruleFields };
}

/** Map Zod issues to dot-path keys for nested objects, e.g. "rules.0.priority". */
export function zodIssuesToPathMap(err: ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_root";
    if (!map[key]) map[key] = issue.message;
  }
  return map;
}

/** For a rule at index `ri`, return field errors keyed by field name for RuleRow. */
export function ruleFieldErrorsFromPolicyIssues(
  issues: Record<string, string>,
  ri: number,
): Record<string, string> {
  const prefix = `rules.${ri}.`;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(issues)) {
    if (k.startsWith(prefix)) {
      out[k.slice(prefix.length)] = v;
    }
  }
  return out;
}
