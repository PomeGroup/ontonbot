import Typography from "@/components/Typography";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import React from "react";

interface Play2WinGenesisDialogProps {
  title: string;
  children: React.ReactNode;
}

export function Play2WinGenesisDialog({ title, children }: Play2WinGenesisDialogProps) {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent
        hideClose
        className="border border-[#51AEFF] rounded-2lg bg-[#06162C] w-[90vw] mx-auto text-white overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <Typography
            variant="title2"
            weight="normal"
          >
            {title}
          </Typography>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <XCircle className="h-7 w-7" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
