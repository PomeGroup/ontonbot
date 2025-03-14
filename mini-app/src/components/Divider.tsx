import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const dividerVariants = cva("w-full", {
  variants: {
    height: {
      "1": "h-0.25",
      "2": "h-0.5",
      "4": "h-1",
      "8": "h-2",
      "16": "h-4",
    },
    margin: {
      none: "my-0",
      small: "my-2",
      medium: "my-4",
      large: "my-6",
    },
    color: {
      dark: "bg-brand-divider-dark",
      light: "bg-brand-divider",
    },
  },
  defaultVariants: {
    height: "2",
    color: "light",
  },
});

const Divider = ({ height, margin, className, color }: VariantProps<typeof dividerVariants> & { className?: string }) => {
  return <div className={cn(dividerVariants({ height, margin, color }), className)} />;
};

export default Divider;
