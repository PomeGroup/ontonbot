"use client";

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
          toast:
            "h-11 group toast group-[.toaster]:bg-[hsla(0,0%,18%,0.8)] group-[.toaster]:border-none group-[.toaster]:text-foreground group-[.toaster]:rounded-md group-[.toaster]:rounded-[14px]",
          title: "group-[.toast]:font-medium group-[.toast]:text-white",
          description: "group-[.toast]:text-muted-foreground",
          icon: "group-[.toast]:w-6 h-6",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
