"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactElement } from "react";

interface ConnectTaskCardProps {
  title: string;
  pointsLabel: string;
  icon: ReactElement; // ← react‑icon component
  done: boolean;
  onGo?: () => void;
}

export default function ConnectTaskCard({ title, pointsLabel, icon, done, onGo }: ConnectTaskCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
      {/* left: icon + labels */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl text-primary">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-gray-500">{pointsLabel}</span>
        </div>
      </div>

      {/* right: button */}
      <Button
        size="sm"
        className={cn(
          "min-w-[72px] rounded-lg border-2",
          done ? "pointer-events-none border-green-500 bg-green-500 text-white" : "border-primary text-primary"
        )}
        variant="ghost"
        disabled={done}
        onClick={!done ? onGo : undefined}
      >
        {done ? "Done" : "Go"}
      </Button>
    </div>
  );
}
