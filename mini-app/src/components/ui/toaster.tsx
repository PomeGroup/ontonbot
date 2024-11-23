"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast p-2 group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-white/30 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-cn-muted-foreground",
          actionButton: "group-[.toast]:bg-cn-primary group-[.toast]:text-cn-primary-foreground",
          cancelButton: "group-[.toast]:bg-cn-muted group-[.toast]:text-cn-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
