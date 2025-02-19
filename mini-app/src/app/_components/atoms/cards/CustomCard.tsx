import Typography from "@/components/Typography";
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
}

const CustomCard: React.FC<CustomCardProps> = ({ title, description, children, defaultPadding = false }) => {
  return (
    <Card
      header={
        title || description ? (
          <>
            {title && (
              <Typography
                weight={"bold"}
                variant="title3"
              >
                {title}
              </Typography>
            )}
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
    >
      {children}
    </Card>
  );
};

export default CustomCard;
