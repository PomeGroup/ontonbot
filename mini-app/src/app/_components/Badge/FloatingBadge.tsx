import { cva, VariantProps } from "class-variance-authority";
import React, { ReactNode } from "react";

const badgeVariants = cva(
  "absolute rounded-md bg-black bg-opacity-50 backdrop-blur-[20px] flex items-center gap-1 px-2 py-1 text-white",
  {
    variants: {
      position: {
        // top left
        "tl-sm": "top-1.5 left-1",
        "tl-md": "top-2.5 left-2.5",
        // bottom center
        "bc-sm": "bottom-1.5 left-1/2 -translate-x-1/2",
        "bc-md": "bottom-2.5 left-1/2 -translate-x-1/2",
      },
    },
    defaultVariants: {
      position: "tl-md",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children?: ReactNode;
  className?: string;
}

export const FloatingBadge: React.FC<BadgeProps> = ({ position, children, className }) => {
  return (
    <div
      className={badgeVariants({
        className,
        position,
      })}
    >
      {children}
    </div>
  );
};
