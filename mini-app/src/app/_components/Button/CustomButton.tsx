import Typography, { TypographyProps } from "@/components/Typography";
import { cva } from "class-variance-authority";
import { Button, Preloader } from "konsta/react";
import React, { ReactNode } from "react";

interface CustomButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "link";
  size?: "lg" | "md";
  color?: "success" | "primary";
  isLoading?: boolean;
  icon?: ReactNode;
  fontSize?: TypographyProps["variant"];
  fontWeight?: TypographyProps["weight"];
  onClick?: (_e: React.MouseEvent<HTMLButtonElement>) => void;
}

const customButtonVariants = cva("!p-0 min-w-20", {
  variants: {
    size: {
      lg: "h-12.5 rounded-2lg",
      md: "h-9 rounded-2lg",
    },
    color: {
      success: "k-color-brand-green",
      danger: "k-color-brand-red",
      primary: "",
    },
  },
  defaultVariants: {
    size: "lg",
    color: "primary",
  },
});

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  icon,
  fontWeight = "medium",
  fontSize = "body",
  variant = "primary",
  size,
  color,
  isLoading = false,
  onClick,
}) => (
  <Button
    itemType="button"
    large
    outline={variant === "outline"}
    clear={variant === "link"}
    disabled={isLoading}
    onClick={onClick}
    className={customButtonVariants({ size, color })}
    // @ts-expect-error the type declaration for this prop does not exist but we should pass it
    type="button"
  >
    <Typography
      variant={fontSize}
      weight={fontWeight}
      className="capitalize"
    >
      {isLoading ? (
        <Preloader size="w-4 h-4" />
      ) : (
        <div className="flex gap-2 items-center">
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </div>
      )}
    </Typography>
  </Button>
);

export default CustomButton;
