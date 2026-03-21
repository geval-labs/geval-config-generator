import { z } from "zod";

export const combineRuleSchema = z.enum(["all_pass", "any_block_blocks"]);

export const operatorSchema = z.enum([
  ">",
  "<",
  ">=",
  "<=",
  "==",
  "presence",
]);

export const actionSchema = z.enum(["pass", "block", "require_approval"]);

export const ruleFormSchema = z
  .object({
    priority: z.coerce.number().int().min(0),
    name: z.string().min(1, "Rule name is required"),
    metric: z.string().min(1, "Metric is required"),
    component: z.string(),
    system: z.string(),
    agent: z.string(),
    step: z.string(),
    operator: operatorSchema,
    threshold: z.string(),
    action: actionSchema,
    reason: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.operator !== "presence") {
      const n = Number(data.threshold);
      if (data.threshold.trim() === "" || Number.isNaN(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Threshold is required (number) unless operator is presence",
          path: ["threshold"],
        });
      }
    }
  });

export const policyFormSchema = z.object({
  path: z
    .string()
    .min(1, "Policy file path is required")
    .regex(/\.(ya?ml)$/i, "Path should end in .yaml or .yml"),
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  rules: z.array(ruleFormSchema).min(1, "At least one rule per policy"),
});

export const contractFormSchema = z.object({
  name: z.string().min(1, "Contract name is required"),
  version: z.string().min(1, "Contract version is required"),
  combine: combineRuleSchema,
});

export const appStateSchema = z.object({
  contract: contractFormSchema,
  policies: z.array(policyFormSchema).min(1, "At least one policy"),
});

export type CombineRule = z.infer<typeof combineRuleSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type RuleForm = z.infer<typeof ruleFormSchema>;
export type PolicyForm = z.infer<typeof policyFormSchema>;
export type ContractForm = z.infer<typeof contractFormSchema>;
export type AppState = z.infer<typeof appStateSchema>;

export function defaultRule(): RuleForm {
  return {
    priority: 1,
    name: "new_rule",
    metric: "accuracy",
    component: "",
    system: "",
    agent: "",
    step: "",
    operator: ">=",
    threshold: "0.9",
    action: "pass",
    reason: "",
  };
}

export function defaultPolicy(index: number): PolicyForm {
  return {
    path: index === 0 ? "policy.yaml" : `policies/gate-${index + 1}.yaml`,
    name: "",
    version: "",
    environment: "prod",
    rules: [defaultRule()],
  };
}

export function defaultAppState(): AppState {
  return {
    contract: {
      name: "release-gate",
      version: "1.0.0",
      combine: "all_pass",
    },
    policies: [defaultPolicy(0)],
  };
}
