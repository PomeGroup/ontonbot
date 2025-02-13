import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const dividerVariants = cva("w-full bg-brand-muted/15", {
  variants: {
    height: {
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
  },
  defaultVariants: {
    height: "2",
  },
});

const Divider = ({ height, margin, className }: VariantProps<typeof dividerVariants> & { className?: string }) => {
  return <div className={cn(dividerVariants({ height, margin }), className)} />;
};

export default Divider;
