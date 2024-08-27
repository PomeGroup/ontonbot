"use client";

import { FC, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";

type CheckInState =
    | "needToCheckin"
    | "checkInError"
    | "checkingInLoading"
    | "checkedInSuccess"
    | "alreadyCheckedIn"
    | "NoTicketData"
    | "ticketInProcess";  // New state for MINTING or VALID statuses

// Type guard to check if the result has the `alreadyCheckedIn` property
const isAlreadyCheckedInResult = (
    result: any
): result is { alreadyCheckedIn: boolean } => {
    return result && typeof result.alreadyCheckedIn === "boolean";
};

const CheckInGuest: FC<{ params: { hash: string } }> = ({ params }) => {
    const WebApp = useWebApp();
    const { authorized, isLoading } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [ticketUuid, setTicketUuid] = useState<string | null>(null);
    const [drawerTitle, setDrawerTitle] = useState<string | null>(null);
    const [drawerContent, setDrawerContent] = useState<JSX.Element | null>(null);
    const [ticketData, setTicketData] = useState<any | null>(null);
    const [checkInState, setCheckInState] = useState<CheckInState>("NoTicketData");

    const ticketQuery = trpc.ticket.getTicketByUuid.useQuery(
        { ticketUuid: ticketUuid ?? "" },
        {
            enabled: !!ticketUuid,
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
        } else if (ticketQuery.isError) {
            setCheckInState("checkInError");
        }
    }, [ticketQuery.isSuccess, ticketQuery.isError, ticketQuery.data]);

    // useEffect to handle checkInState changes and manage drawer content and open/close logic
    useEffect(() => {
        let content: JSX.Element | null = null;
        let title: string | null = null;

        switch (checkInState) {
            case "needToCheckin":
                title = "Ticket Information";
                content = renderTicketInfo(ticketData);
                break;
            case "checkInError":
                title = "Check-In Error";
                content = renderScanError("Failed to check in the ticket. Please try again.");
                break;
            case "checkingInLoading":
                title = "Ticket Information";
                content = renderTicketInfo(ticketData);
                break;
            case "checkedInSuccess":
                title = "Check-In Success";
                content = renderTicketInfo(ticketData);
                break;
            case "alreadyCheckedIn":
                title = "Ticket Information";
                content = renderTicketInfo(ticketData);
                break;
            case "ticketInProcess":  // Handling the new state for tickets in process
                title = "Ticket Information";
                content = (
                    <div>
                        <p>Your ticket is currently being processed. Please wait.</p>
                        <Button disabled>In Process</Button>
                    </div>
                );
                break;
            case "NoTicketData":
                title = null;
                content = null;
                break;
            default:
                title = null;
                content = null;
        }
        if(title===null || content===null) return;
        setDrawerTitle(title);
        setDrawerContent(content);
        setDrawerOpen(true);

    }, [checkInState, ticketData]);

    // in some cases we need to clear the ticket data  to avoid showing old data when re-scanning
    useEffect(() => {
        if(!drawerOpen){
            setTicketData(null);
            setTicketUuid(null);
            setCheckInState("NoTicketData");
        }
    }, [drawerOpen]);

    const checkInMutation = trpc.ticket.checkInTicket.useMutation({
        onSuccess: (result) => {
            if (isAlreadyCheckedInResult(result)) {
                setCheckInState("alreadyCheckedIn");
            } else {
                setCheckInState("checkedInSuccess");
            }
            //ticketQuery.refetch(); // Refetch the ticket data after check-in
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
            console.error("No valid ticket data available for check-in.");
            setCheckInState("NoTicketData");
        }
    }, [ticketData, checkInMutation]);

    useEffect(() => {
        if (ticketUuid && ticketUuid.length > 0) {
            ticketQuery.refetch(); // Fetch ticket data again when ticketUuid changes
        }
    }, [ticketUuid]);

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
                alert("Error scanning QR code");
            } finally {
                WebApp?.closeScanQrPopup?.();
                WebApp.BackButton.show();
            }
        });
    };

    const renderTicketInfo = useCallback((data: any) => (
        <>
            <DrawerHeader>
                <DrawerTitle>{drawerTitle}</DrawerTitle>
                <DrawerDescription>
                    <p>
                        <strong>Name:</strong> {data.name}
                    </p>
                    <p>
                        <strong>Company:</strong> {data.company}
                    </p>
                    <p>
                        <strong>Position:</strong> {data.position}
                    </p>
                    <p>
                        <strong>Status:</strong> {data.status}
                    </p>
                </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
                {checkInState === "alreadyCheckedIn" && (
                    <Button disabled>Already Checked In</Button>
                )}
                {checkInState === "checkingInLoading" && (
                    <Button disabled>Checking In...</Button>
                )}
                {checkInState === "checkedInSuccess" && (
                    <Button disabled>Checked In Successfully</Button>
                )}
                {checkInState === "needToCheckin" && (
                    <Button onClick={handleCheckIn}>Check In</Button>
                )}
                {checkInState === "checkInError" && (
                    <Button disabled>Check In Error</Button>
                )}
                {checkInState === "ticketInProcess" && (
                    <Button disabled>In Process</Button>
                )}
                {checkInState === "NoTicketData" && (
                    <Button disabled>Loading Ticket Data...</Button>
                )}
            </DrawerFooter>
        </>
    ), [drawerTitle, checkInState, handleCheckIn]);

    const renderScanError = (errorMessage: string) => (
        <>
            <DrawerHeader>
                <DrawerTitle>{drawerTitle}</DrawerTitle>
                <DrawerDescription>{errorMessage}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
                <Button onClick={handleScanQr}>Scan Again</Button>
            </DrawerFooter>
        </>
    );

    return (
        <>
            <Link href={`/events/{params.hash}`}>see event</Link>

            <Button onClick={handleScanQr} className="mt-4">
                Open QR Code Scanner
            </Button>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>{drawerContent}</DrawerContent>
            </Drawer>
        </>
    );
};

export default CheckInGuest;
