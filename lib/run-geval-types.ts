export type GevalRunRequest = {
  contractYaml: string;
  policies: { relativePath: string; content: string }[];
  signalsJson: string;
};

export type GevalRunResponse =
  | {
      ok: true;
      exitCode: number;
      outcome: "PASS" | "REQUIRE_APPROVAL" | "BLOCK" | "UNKNOWN";
      json: unknown;
      stdout: string;
      stderr: string;
    }
  | {
      ok: false;
      error: string;
      stderr?: string;
    };
