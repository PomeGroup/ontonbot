"use client";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  // AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ParticipantErrorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ParticipantErrorDialog: React.FC<ParticipantErrorDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onClose}
    >
      <AlertDialogContent className="w-[80%] max-w-none border-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Error</AlertDialogTitle>
          <AlertDialogDescription>
            You must select at least one participation type.
            <br />
            It will be set to default values.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/*<AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>*/}
          <AlertDialogAction onClick={onConfirm}>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ParticipantErrorDialog;
