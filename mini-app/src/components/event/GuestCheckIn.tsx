import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertGeneric } from "@/components/ui/alert";
import useWebApp from "@/hooks/useWebApp";

const GuestCheckIn = ({ eventId }) => {
  const [guestId, setGuestId] = useState("");
  const [checkInStatus, setCheckInStatus] = useState(null);
  const webApp = useWebApp();

  const checkInMutation = trpc.ticket.checkInTicket.useMutation({
    onSuccess: (data) => {
      setCheckInStatus({ success: true, message: "Check-in successful" });
    },
    onError: (error) => {
      setCheckInStatus({ success: false, message: error.message });
    },
  });

  const handleCheckIn = () => {
    if (!guestId) {
      setCheckInStatus({ success: false, message: "Please enter a guest ID" });
      return;
    }
    checkInMutation.mutate({
      ticketUuid: guestId,
      init_data: webApp?.initData || "",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Guest Check-In</h2>
      <Input
        type="text"
        placeholder="Enter Guest ID"
        value={guestId}
        onChange={(e) => setGuestId(e.target.value)}
        className="mb-4"
      />
      <Button
        onClick={handleCheckIn}
        disabled={checkInMutation.isLoading}
      >
        {checkInMutation.isLoading ? "Checking In..." : "Check In Guest"}
      </Button>
      {checkInStatus && (
        <AlertGeneric
          variant={checkInStatus.success ? "info" : "destructive"}
          className="mt-4"
        >
          {checkInStatus.message}
        </AlertGeneric>
      )}
    </div>
  );
};

export default GuestCheckIn;
