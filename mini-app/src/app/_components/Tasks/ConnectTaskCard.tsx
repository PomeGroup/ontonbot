/* components/Tasks/ConnectTaskCard.tsx */
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactElement } from "react";

interface ConnectTaskCardProps {
  title: string;
  description: string | null; // ← NEW
  pointsLabel: string;
  icon: ReactElement;
  done: boolean;
  loading?: boolean;
  onGo?: () => void;
}

export default function ConnectTaskCard({
  title,
  description,
  pointsLabel,
  icon,
  done,
  loading,
  onGo,
}: ConnectTaskCardProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 mb-4">
      {/* left ‑‑ icon + text */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 min-w-14 items-center justify-center rounded-full bg-gray-100 text-3xl text-primary">
          {icon}
        </div>

        <div className="flex flex-col">
          <span className="font-medium leading-tight">{title}</span>

          {description && <span className="text-xs text-gray-500 leading-tight">{description}</span>}

          <span className="text-sm text-gray-400">{pointsLabel}</span>
        </div>
      </div>

      {/* right ‑‑ action button */}
      <Button
        size="sm"
        className={cn(
          "min-w-[82px] rounded-lg border-2",
          done ? "pointer-events-none border-green-500 bg-green-500 text-white" : "border-primary text-primary"
        )}
        variant="ghost"
        disabled={done || loading}
        onClick={!done && !loading ? onGo : undefined}
      >
        {done ? "Done" : loading ? "Loading…" : "Go"}
      </Button>
    </div>
  );
}
