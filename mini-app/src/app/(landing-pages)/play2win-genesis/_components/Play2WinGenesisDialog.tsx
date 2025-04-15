import Typography from "@/components/Typography";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import React from "react";

interface Play2WinGenesisDialogProps {
  title?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  hideClose?: boolean;
}

export function Play2WinGenesisDialog({
  title,
  children,
  trigger,
  open,
  onOpenChange,
  hideTrigger = false,
  hideClose = false,
}: Play2WinGenesisDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Trigger */}
      {!hideTrigger && (trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger>Open</DialogTrigger>)}
      {/* Content */}
      <DialogContent
        hideClose={true}
        className="border border-[#51AEFF] rounded-2lg bg-[#06162C] w-[90vw] mx-auto text-white overflow-y-auto"
      >
        {(title || !hideClose) && (
          <div className="flex justify-between items-center">
            {title && (
              <Typography
                variant="title2"
                weight="normal"
              >
                {title}
              </Typography>
            )}
            {!hideClose && (
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <XCircle className="h-7 w-7" />
                <span className="sr-only">Close</span>
              </DialogClose>
            )}
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
