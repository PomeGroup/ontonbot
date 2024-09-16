"use client";
import { Button } from "@/components/ui/button";
import { LucideLoader2 } from "lucide-react";
import { FC } from "react";
import { createPortal } from "react-dom";

export interface MainButtonProps {
  disabled?: boolean;
  text?: string;
  color?: "primary" | "secondary";
  onClick?: () => void;
  progress?: boolean;
}

const MainButton: FC<MainButtonProps> = ({
  disabled = false,
  text,
  color,
  onClick,
  progress = false,
}) => (
  <>
    {createPortal(
      <h1 className="sticky bottom-0 py-2 px-4 bg-background border-t border-muted w-full">
        <Button
          variant={color || "primary"}
          className="w-full"
          onClick={onClick}
          disabled={progress || disabled}
        >
          {progress ? <LucideLoader2 className="animate-spin" /> : text}
        </Button>
      </h1>,
      window.document.body
    )}
  </>
);

export default MainButton;
