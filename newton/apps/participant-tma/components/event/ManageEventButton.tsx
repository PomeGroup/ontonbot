"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useUtils } from "@tma.js/sdk-react";
import { Button } from "@ui/base/button";
import { RiPencilLine } from "react-icons/ri";

import { env } from "~/env.mjs";

const ManageEventButton = () => {
  const tmaUtils = useUtils(true);
  const params = useParams<{ id: string }>();

  const manageEventBtnOnClick = () => {
    tmaUtils?.openTelegramLink(
      `https://t.me/${env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=edit_${params.id}`,
    );
  };

  return (
    <Button
      variant="regular"
      className="w-full space-x-2"
      onClick={manageEventBtnOnClick}
    >
      <RiPencilLine size={20} />
      <span>Manage Event</span>
    </Button>
  );
};

export default ManageEventButton;
