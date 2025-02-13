import React from "react";
import { Button, Preloader } from "konsta/react";
import Typography from "@/components/Typography";

interface CustomButtonProps {
  title: string;
  variant?: "primary" | "outline";
  isLoading?: boolean;
  onClick: (_e: React.MouseEvent<HTMLButtonElement>) => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, variant = "primary", isLoading = false, onClick }) => (
  <Button
    title={title}
    itemType="button"
    large
    outline={variant === "outline"}
    disabled={isLoading}
    onClick={onClick}
    className="rounded-2lg"
  >
    <Typography
      variant="headline"
      weight="bold"
      className="capitalize"
    >
      {isLoading && variant === "primary" ? <Preloader size="w-4 h-4" /> : title}
    </Typography>
  </Button>
);

export default CustomButton;
