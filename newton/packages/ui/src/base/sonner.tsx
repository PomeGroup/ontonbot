"use client";

import { CircleX } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          error: "bg-red-600/90 text-white",
          toast:
            "h-11 group toast group-[.toaster]:border-none group-[.toaster]:text-foreground group-[.toaster]:rounded-md group-[.toaster]:rounded-[14px]",
          icon: "group-[.toast]:w-6 h-6",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        error: <CircleX />
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
