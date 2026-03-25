"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OutcomeBadge({
  outcome,
}: {
  outcome: "PASS" | "REQUIRE_APPROVAL" | "BLOCK" | "UNKNOWN";
}) {
  const cls =
    outcome === "PASS"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : outcome === "BLOCK"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : outcome === "REQUIRE_APPROVAL"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border",
        cls,
      )}
    >
      {outcome === "PASS" ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : outcome === "BLOCK" ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5" />
      )}
      {outcome}
    </span>
  );
}
