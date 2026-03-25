"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Editor" },
  { href: "/run", label: "Run policy" },
] as const;

export function SiteHeader({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
      <div className="mx-auto max-w-[1600px] glass border border-border/50 rounded-2xl flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-8 flex items-center justify-center bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Geval
              </span>
              <span className="text-primary/80 font-medium text-sm hidden sm:inline ml-2">
                Config
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children && (
          <div className="flex items-center gap-3 flex-wrap justify-end">{children}</div>
        )}
      </div>
    </header>
  );
}
