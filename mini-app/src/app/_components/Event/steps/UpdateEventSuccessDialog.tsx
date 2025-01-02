"use client";

import React from "react";
import { Dialog, DialogButton } from "konsta/react";
import { useRouter } from "next/navigation";
import useWebApp from "@/hooks/useWebApp";

interface UpdateEventSuccessDialogProps {
  open: boolean;
  eventUuid: string | undefined;
  onClose: () => void;
}

const UpdateEventSuccessDialog: React.FC<UpdateEventSuccessDialogProps> = ({
                                                                             open,
                                                                             eventUuid,
                                                                             onClose,
                                                                           }) => {
  const router = useRouter();
  const webApp = useWebApp(); // Hook for Telegram Mini App integration

  const handleGuestList = () => {
    console.log("handleGuestList", eventUuid);
    if (eventUuid) {
      console.log("handleGuestLists2", eventUuid);
      router.push(`/events/${eventUuid}/edit#guest-list`);
    }
    onClose();
  };

  const handleViewEvent = () => {
    if (eventUuid) {
      console.log("handleViewEvent", eventUuid);
      webApp?.openTelegramLink(
        `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`
      );
    }
    onClose();
  };

  return (
    <Dialog
      opened={open}
      onBackdropClick={onClose}
      className="myDialog max-w-[400px] w-11/12 p-0 mx-auto bg-white bg-opacity-100"
      colors={{ bgIos: "bg-white", bgMaterial: "bg-white" }}
      translucent={false}
      title="Event Updated"
      content={
        <p className="text-center text-sm text-gray-700">
          Your event has been updated successfully. What would you like to do next?
        </p>
      }
      buttons={
        <div className="flex justify-end space-x-0 px-0 pb-0 bg-white w-full">
          <DialogButton onClick={handleGuestList} className="w-1/2 text-sm">
            Guest List
          </DialogButton>
          <DialogButton
            onClick={handleViewEvent}
            className="w-1/2 text-sm"
          >
            View Event
          </DialogButton>
        </div>
      }
    />
  );
};

export default UpdateEventSuccessDialog;
