"use client";
import { useUtils } from "@tma.js/sdk-react";
import { Button } from "@ui/base/button";

export const ClaimTicketButton: React.FC<{ link: string }> = (props) => {
  const tmaUtils = useUtils(true);

  return (
    <Button
      onClick={() => {
        tmaUtils?.openTelegramLink(props.link);
      }}
      className="w-full"
    >
      Claim Ticket
    </Button>
  );
};
