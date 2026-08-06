"use client";

import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbCrumb {
  label: string;
  onClick?: () => void;
}

interface PageBreadcrumbProps {
  crumbs: BreadcrumbCrumb[];
  className?: string;
}

/**
 * PageBreadcrumb — a compact nav trail rendered below the sticky header.
 * Crumbs prop: [ { label: "Home", onClick }, { label: "Middle", onClick }, { label: "Current Page" } ]
 * Last crumb = current page (non-clickable, highlighted).
 * Mobile: shows only  🏠 › Current Page.
 * Desktop (sm+): shows full trail.
 */
export function PageBreadcrumb({ crumbs, className }: PageBreadcrumbProps) {
  if (crumbs.length === 0) return null;

  const current = crumbs[crumbs.length - 1];
  const parents = crumbs.slice(0, -1);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "w-full bg-background/50 border-b border-border/20 px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="mx-auto max-w-7xl h-8 flex items-center gap-1 text-[11px] overflow-x-auto scrollbar-none whitespace-nowrap">
        {/* First parent (Home) — always visible */}
        {parents[0] && (
          <button
            onClick={parents[0].onClick}
            className="shrink-0 flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors duration-150 font-medium"
            aria-label="Go to Home"
          >
            <Home className="w-3 h-3" />
            <span className="hidden sm:inline">{parents[0].label}</span>
          </button>
        )}

        {/* Middle crumbs — hidden on mobile, shown on sm+ */}
        {parents.slice(1).map((crumb, i) => (
          <span key={i} className="hidden sm:flex items-center gap-1 shrink-0">
            <ChevronRight className="w-3 h-3 text-border" />
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="text-muted-foreground hover:text-gold transition-colors duration-150 font-medium"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-muted-foreground">{crumb.label}</span>
            )}
          </span>
        ))}

        {/* Separator before current */}
        <ChevronRight className="w-3 h-3 text-border shrink-0" />

        {/* Current page — always visible, slightly highlighted */}
        <span className="text-foreground/75 font-semibold shrink-0 tracking-wide">
          {current.label}
        </span>
      </div>
    </nav>
  );
}
