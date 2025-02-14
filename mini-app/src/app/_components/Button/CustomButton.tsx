import React, { ReactNode } from "react";
import { Button, Preloader } from "konsta/react";
import Typography, { TypographyProps } from "@/components/Typography";

interface CustomButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "link";
  isLoading?: boolean;
  icon?: ReactNode;
  fontSize?: TypographyProps["variant"];
  fontWeight?: TypographyProps["weight"];
  onClick: (_e: React.MouseEvent<HTMLButtonElement>) => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  icon,
  fontWeight = "semibold",
  fontSize = "headline",
  variant = "primary",
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
    className="rounded-2lg h-12"
    // @ts-expect-error the type declaration for this prop does not exist but we should pass it
    type="button"
  >
    <Typography
      variant={fontSize}
      weight={fontWeight}
      className="capitalize"
    >
      {isLoading && variant === "primary" ? (
        <Preloader size="w-4 h-4" />
      ) : (
        <>
          <div className="flex gap-2 items-center">
            {icon}
            <span>{children}</span>
          </div>
        </>
      )}
    </Typography>
  </Button>
);

export default CustomButton;
