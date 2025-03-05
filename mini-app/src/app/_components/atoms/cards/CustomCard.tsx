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
}

const CustomCard: React.FC<CustomCardProps> = ({ title, description, children, defaultPadding = false, className }) => {
  return (
    <Card
      header={
        title || description ? (
          <>
            {title && <Typography variant="title3">{title}</Typography>}
            {description && (
              <Typography
                variant="body"
                weight="normal"
                className="mt-4"
              >
                {description}
              </Typography>
            )}
          </>
        ) : undefined
      }
      contentWrap={defaultPadding}
      margin="m-0"
      className={cn(className)}
    >
      {children}
    </Card>
  );
};

export default CustomCard;
