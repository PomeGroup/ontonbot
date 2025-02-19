import React from "react";
import { Sheet } from "konsta/react";
import { IoCloseCircleOutline } from "react-icons/io5";
import Typography from "@/components/Typography";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface ReusableSheetProps {
  title: string;
  opened: boolean;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  defaultPadding?: boolean;
}

const ReusableSheet: React.FC<ReusableSheetProps> = ({
  title,
  opened,
  children,
  className,
  defaultPadding = true,
  onClose,
}) =>
  createPortal(
    <Sheet
      opened={opened}
      className={cn("w-full rounded-t-2xl max-h-screen", className)}
      onBackdropClick={onClose}
    >
      <div className="flex !mt-5 mx-4 justify-between items-center">
        <Typography
          variant="title3"
          weight="normal"
        >
          {title}
        </Typography>
        <button onClick={onClose}>
          <IoCloseCircleOutline className="text-2xl" />
        </button>
      </div>
      <div
        className={cn({
          "p-4": defaultPadding,
        })}
      >
        {children}
      </div>
    </Sheet>,
    document.body
  );

export default ReusableSheet;
