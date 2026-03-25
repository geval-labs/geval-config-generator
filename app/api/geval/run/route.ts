import { execFile } from "child_process";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join, dirname, resolve } from "path";
import { promisify } from "util";
import type { GevalRunRequest, GevalRunResponse } from "@/lib/run-geval-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const execFileAsync = promisify(execFile);

function assertSafeRelativePath(base: string, rel: string): string {
  if (rel.includes("..") || rel.startsWith("/") || /^[a-zA-Z]:/.test(rel)) {
    throw new Error(`Invalid policy path: ${rel}`);
  }
  const abs = resolve(base, rel);
  const baseR = resolve(base);
  if (!abs.startsWith(baseR)) {
    throw new Error(`Invalid policy path: ${rel}`);
  }
  return abs;
}

function mapOutcome(
  code: number,
): "PASS" | "REQUIRE_APPROVAL" | "BLOCK" | "UNKNOWN" {
  if (code === 0) return "PASS";
  if (code === 1) return "REQUIRE_APPROVAL";
  if (code === 2) return "BLOCK";
  return "UNKNOWN";
}

export async function POST(req: Request): Promise<Response> {
  let body: GevalRunRequest;
  try {
    body = (await req.json()) as GevalRunRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" } satisfies GevalRunResponse,
      { status: 400 },
    );
  }

  const { contractYaml, policies, signalsJson } = body;
  if (!contractYaml?.trim() || !signalsJson?.trim()) {
    return Response.json(
      {
        ok: false,
        error: "contractYaml and signalsJson are required",
      } satisfies GevalRunResponse,
      { status: 400 },
    );
  }
  if (!policies?.length) {
    return Response.json(
      { ok: false, error: "At least one policy file is required" } satisfies GevalRunResponse,
      { status: 400 },
    );
  }

  const gevalBin = process.env.GEVAL_PATH?.trim() || "geval";
  const dir = await mkdtemp(join(tmpdir(), "geval-run-"));

  try {
    await writeFile(join(dir, "contract.yaml"), contractYaml, "utf8");
    await writeFile(join(dir, "signals.json"), signalsJson, "utf8");

    for (const p of policies) {
      const dest = assertSafeRelativePath(dir, p.relativePath);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, p.content, "utf8");
    }

    let stdout = "";
    let stderr = "";
    let code = 1;
    try {
      const result = await execFileAsync(
        gevalBin,
        [
          "check",
          "--contract",
          "contract.yaml",
          "--signals",
          "signals.json",
          "--json",
        ],
        {
          cwd: dir,
          maxBuffer: 10 * 1024 * 1024,
          timeout: 25_000,
        },
      );
      stdout = result.stdout?.toString() ?? "";
      stderr = result.stderr?.toString() ?? "";
      code = 0;
    } catch (err: unknown) {
      const e = err as {
        code?: string | number;
        status?: number;
        stdout?: Buffer;
        stderr?: Buffer;
        message?: string;
      };
      stdout = e.stdout?.toString() ?? "";
      stderr = e.stderr?.toString() ?? "";
      if (e.code === "ENOENT" || e.message?.includes("ENOENT")) {
        await rm(dir, { recursive: true, force: true });
        return Response.json({
          ok: false,
          error:
            "Geval CLI not found. Install Geval and add it to PATH, or set GEVAL_PATH to the binary.",
          stderr: stderr || e.message,
        } satisfies GevalRunResponse);
      }
      if (typeof e.code === "number" && e.code !== 0) {
        code = e.code;
      } else if (typeof e.status === "number") {
        code = e.status;
      } else {
        code = 1;
      }
    }

    let json: unknown = null;
    try {
      json = JSON.parse(stdout.trim() || "{}");
    } catch {
      json = { _note: "stdout was not JSON", stdout };
    }

    const outcome = mapOutcome(code);

    await rm(dir, { recursive: true, force: true });

    return Response.json({
      ok: true,
      exitCode: code,
      outcome,
      json,
      stdout,
      stderr,
    } satisfies GevalRunResponse);
  } catch (err) {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error: message } satisfies GevalRunResponse,
      { status: 500 },
    );
  }
}
