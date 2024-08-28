"use client";

import { FC, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import TicketDrawer from "./TicketDrawer"; // Import the TicketDrawer component
import { Button } from "@/components/ui/button";
import { CheckInState } from "./CheckInState";

const CheckInGuest: FC<{ params: { hash: string } }> = ({ params }) => {
  const WebApp = useWebApp();
  const { authorized, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ticketUuid, setTicketUuid] = useState<string | null>(null);
  const [drawerTitle, setDrawerTitle] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<any | null>(null);
  const [checkInState, setCheckInState] =
      useState<CheckInState>("NoTicketData");

  const ticketQuery = trpc.ticket.getTicketByUuid.useQuery(
      { ticketUuid: ticketUuid ?? "" },
      {
        enabled: !!ticketUuid,
        retry: false,
      }
  );

  const eventTicketQuery = trpc.eventTicket.getEventTicketById.useQuery(
      { ticketId: ticketData?.ticket_id ?? 0 }, // Assuming ticket_id is available
      {
        enabled: !!ticketData?.ticket_id,
        retry: false,
      }
  );

  useEffect(() => {
    if (ticketQuery.isSuccess && ticketQuery.data) {
      const data = ticketQuery.data;
      setTicketData(data);

      // Handle the new states for MINTING or VALID
      if (data.status === "USED") {
        setCheckInState("alreadyCheckedIn");
      } else if (data.status === "UNUSED") {
        setCheckInState("needToCheckin");
      } else if (data.status === "MINTING" || data.status === "VALID") {
        setCheckInState("ticketInProcess");
      }
      setDrawerOpen(true); // Ensure the drawer opens after successful data fetch
    } else if (ticketQuery.isError) {
      setCheckInState("checkInError");
      setDrawerOpen(true); // Ensure the drawer opens on error as well
    }
  }, [ticketQuery.isSuccess, ticketQuery.isError, ticketQuery.data]);

  // Close drawer and reset states when the drawer is closed
  useEffect(() => {
    if (!drawerOpen) {
      setTicketData(null);
      setTicketUuid(null);
      setCheckInState("NoTicketData");
    }
  }, [drawerOpen]);

  const checkInMutation = trpc.ticket.checkInTicket.useMutation({
    onSuccess: (result) => {
      if (result && "alreadyCheckedIn" in result) {
        setCheckInState("alreadyCheckedIn");
      } else {
        setCheckInState("checkedInSuccess");
      }
    },
    onError: () => {
      setCheckInState("checkInError");
    },
  });

  const handleCheckIn = useCallback(() => {
    if (ticketData && ticketData.order_uuid) {
      setCheckInState("checkingInLoading");
      checkInMutation.mutate({ ticketUuid: ticketData.order_uuid });
    } else {
      setCheckInState("NoTicketData");
    }
  }, [ticketData, checkInMutation]);

  const handleScanQr = () => {
    if (!WebApp?.isVersionAtLeast("6.0")) {
      setCheckInState("checkInError");
      return;
    }

    WebApp?.showScanQrPopup?.({}, (qrText) => {
      try {
        const uuidMatch = qrText.match(/ticket_uuid=([\w-]+)/);
        if (uuidMatch && uuidMatch[1]) {
          setTicketUuid(uuidMatch[1]);
        }
      } catch (error) {
        setCheckInState("checkInError");
      } finally {
        WebApp?.closeScanQrPopup?.();
        WebApp.BackButton.show();
      }
    });
  };

  return (
      <>
        <Link href={`/events/{params.hash}`}>see event</Link>

        <Button onClick={handleScanQr} className="mt-4">
          Open QR Code Scanner
        </Button>

        <TicketDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            drawerTitle={drawerTitle}
            checkInState={checkInState}
            ticketData={ticketData}
            eventTicketData={eventTicketQuery.data}
            handleCheckIn={handleCheckIn}
            handleScanQr={handleScanQr}
        />
      </>
  );
};

export default CheckInGuest;
