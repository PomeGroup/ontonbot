import Typography from "@/components/Typography";
import { cn } from "@/lib/utils";
import { Card } from "konsta/react";
import React, { ReactNode } from "react";

interface CustomCardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  /**
   * By default it's false
   */
  defaultPadding?: boolean;
  className?: string;
  /**
   * Callbacks
   */
  onClick?: () => void;
}

const CustomCard: React.FC<CustomCardProps> = ({
  title,
  description,
  children,
  defaultPadding = false,
  className,
  onClick,
}) => {
  return (
    <Card
      header={
        title || description ? (
          <div>
            {title && <Typography variant="title3">{title}</Typography>}
            {description && (
              <Typography
                variant="body"
                weight="normal"
                className="mt-2"
              >
                {description}
              </Typography>
            )}
          </div>
        ) : undefined
      }
      onClick={onClick}
      contentWrap={defaultPadding}
      margin="m-0"
      className={cn("[&>div]:h-full", className)}
    >
      {children}
    </Card>
  );
};

export default CustomCard;
