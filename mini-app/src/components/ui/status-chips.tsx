import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { Chip } from "konsta/react";

export interface StatusChipProps {
  variant?: "primary" | "success" | "danger" | "default" | "warning";
  label: string;
  className?: string;
  onDelete?: (_: string) => void;
  showDeleteButton?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = (props) => {
  const variantStyles = cva("capitalize", {
    variants: {
      variant: {
        primary: "bg-blue-500 text-blue-600",
        success: "bg-green-500 text-green-700",
        danger: "bg-red-500 text-red-600",
        default: "bg-gray-500 text-gray-600",
        warning: "bg-yellow-500 text-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  return (
    <Chip
      onDelete={props.onDelete}
      deleteButton={props.showDeleteButton}
      className={cn(variantStyles({ variant: props.variant, className: props.className }))}
    >
      {props.label}
    </Chip>
  );
};

export default StatusChip;
