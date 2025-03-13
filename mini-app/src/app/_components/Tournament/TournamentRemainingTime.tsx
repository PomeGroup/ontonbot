import React from "react";
import { Badge } from "../Badge/Badge";

export const TournamentTimeRemaining: React.FC<{
  endDate: string;
  closeOnly?: boolean;
  space?: "sm" | "md";
}> = (props) => {
  const now = new Date();
  const end = new Date(props.endDate);
  const diffTime = end.getTime() - now.getTime();
  const oneHour = 1000 * 60 * 60;

  if (props.closeOnly && diffTime >= oneHour * 3) {
    return null;
  }

  const isLessThanOneHour = diffTime < oneHour;
  const diffValue = isLessThanOneHour ? Math.ceil(diffTime / (1000 * 60)) : Math.ceil(diffTime / oneHour);

  return (
    <Badge
      diffTime={diffTime}
      diffValue={diffValue}
      isLessThanOneHour={isLessThanOneHour}
      space={props.space}
    />
  );
};
