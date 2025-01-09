import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { useGetEvent, useGetEventRegistrants } from "@/hooks/events.hooks";
import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { List, BlockTitle, ListItem, BlockHeader, Sheet, BlockFooter, Block } from "konsta/react";
import { Check, FileUser, Pencil, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import DataStatus from "../molecules/alerts/DataStatus";
import { createPortal } from "react-dom";
import QrCodeButton from "../atoms/buttons/QrCodeButton";
import EventImage from "../atoms/images/EventImage";
import { useMainButton } from "@/hooks/useMainButton";
import useWebApp from "@/hooks/useWebApp";
import ScanRegistrantQRCode from "./ScanRegistrantQRCode";
import StatusChip from "@/components/ui/status-chips";
import ButtonPOA from "@/app/_components/atoms/buttons/ButtonPOA";
import OrganizerNotificationHandler from "@/app/_components/OrganizerNotificationHandler";
import { EventTriggerType } from "@/db/enum";

interface CustomListItemProps {
  name: string;
  username: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "checkedin";
  user_id: number;
  registrantInfo: any;
  handleApprove: (_: number) => Promise<void>;
  handleReject: (_: number) => Promise<void>;
  className?: string;
  hasPayment: boolean;
}

const CustomListItem: React.FC<CustomListItemProps> = ({
  name,
  username,
  date,
  status,
  user_id,
  registrantInfo,
  handleApprove,
  handleReject,
  className,
  hasPayment,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [itemStatus, setItemStatus] = useState(status);

  const [showRegistrantInfo, setShowRegistrantInfo] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);


  const handleEdit = () => {
    // Change status to "pending"
    setIsEditing(true);
  };

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await handleApprove(user_id);
      // Optimistically update the status to "approved"
      // This would typically be managed in the parent component's state
      setItemStatus("approved");
      setIsEditing(false);
    } catch (error) {
      // console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = async () => {
    setIsDeclining(true);
    try {
      await handleReject(user_id);
      // Optimistically update the status to "declined"
      setItemStatus("rejected");
      setIsEditing(false);
    } catch (error) {
      // console.error("Reject failed:", error);
    } finally {
      setIsDeclining(false);
    }
  };

  const { footerContent, afterContent } = useMemo(() => {
    let afterContent;
    let footerContent;

    switch (itemStatus) {
      case "pending":
        afterContent = (
          <div className="flex space-x-2">
            <Button
              icon={<FileUser size={18} />}
              variant="purple"
              onClick={() => {
                setShowRegistrantInfo(registrantInfo);
              }}

            />

            <div className="flex flex-col text-end text-xs">
              <span>{date}</span>
              <span>Registered</span>
            </div>
          </div>
        );
        footerContent = hasPayment ? null : (
          <div className="flex space-x-2">
            <Button
              variant="danger"
              icon={<X size={18} />}
              label="Reject"
              onClick={handleRejectClick}
              isLoading={isDeclining}
            />
            <Button
              variant="success"
              icon={<Check size={19} />}
              label="Approve"
              onClick={handleApproveClick}
              isLoading={isApproving}
            />
          </div>
        );
        break;
      case "checkedin":
      case "approved":
        afterContent = (
          <div className="flex space-x-2">

            <Button
              icon={<FileUser size={18} />}
              variant="purple"
              onClick={() => {
                setShowRegistrantInfo(registrantInfo);
              }}
            />
            {!hasPayment && (
                <>
                  <Button
                    icon={<Pencil size={18} />}
                    onClick={handleEdit}
                  />

                </>
            )}
            <StatusChip
              variant={itemStatus === "checkedin" ? "primary" : "success"}
              label={itemStatus}
            />
          </div>
        );
        footerContent = hasPayment || !isEditing ? null : (
          <div className="flex space-x-2">
            <Button
              variant="danger"
              icon={<X size={18} />}
              label="Reject"
              onClick={handleRejectClick}
              isLoading={isDeclining}
            />
          </div>
        );

        break;

      case "rejected":
        afterContent = (
          <div className="flex space-x-2">

            <Button
              icon={<FileUser size={18} />}
              variant="purple"
              onClick={() => {
                setShowRegistrantInfo(registrantInfo);
              }}
            />
            {!hasPayment && (
              <>
                <Button
                  icon={<Pencil size={18} />}
                  onClick={handleEdit}
                />
                <StatusChip
                  variant="danger"
                  label="Rejected"
                />
              </>
            )}
          </div>
        );
        footerContent = hasPayment || !isEditing ? null : (
          <div className="flex space-x-2">
            <Button
              variant="success"
              icon={<Check size={19} />}
              label="Approve"
              onClick={handleApproveClick}
              isLoading={isApproving}
            />
          </div>
        );
        break;
      default:
        afterContent = null;
        footerContent = null;
    }
    return {
      afterContent,
      footerContent,
    };
  }, [itemStatus, registrantInfo, date, hasPayment, isDeclining, isApproving, isEditing]);

  return (
    <>
      <ListItem
        className={`!ps-0 ${className || ""}`}
        title={
          <div className="w-44">
            <h4 className="truncate">{name}</h4>
            <p className="text-xs truncate text-cn-muted-foreground">{username}</p>
          </div>
        }
        after={afterContent}
        footer={footerContent}
      />
      {createPortal(
        <Sheet
          onBackdropClick={() => setShowRegistrantInfo(null)}
          opened={Boolean(showRegistrantInfo)}
          className={cn("!overflow-hidden w-full", { hidden: !Boolean(showRegistrantInfo) })}
        >
          <BlockTitle>Registrant Info</BlockTitle>
          <List className="!pe-2">
            {Object.entries(registrantInfo as object).map(([key, value], idx) => {
              return (
                <ListItem
                  key={idx}
                  title={<div className="capitalize">{key.split("_").join(" ")}</div>}
                  subtitle={value}
                />
              );
            })}
          </List>
          <BlockFooter>
            <KButton onClick={() => setShowRegistrantInfo(null)}>Close</KButton>
          </BlockFooter>
        </Sheet>,
        document.body
      )}
    </>
  );
};

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "success" | "purple";
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ variant, icon, label, onClick, isLoading, className }) => {
  const variantStyles = cva("", {
    variants: {
      variant: {
        primary: "",
        secondary: "k-color-brand-gray",
        danger: "k-color-brand-red",
        success: "k-color-brand-green",
        purple: "k-color-brand-purple",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  });

  return (
    <KButton
      rounded
      className={cn(variantStyles({ variant, className }))}
      tonal
      small
      onClick={onClick}
      disabled={isLoading}
    >
      {icon && <span>{icon}</span>}
      {label && <span>{label}</span>}
    </KButton>
  );
};

const RegistrationGuestList = () => {
  /*
   * Get Event Registrants
   */
  const params = useParams<{ hash: string }>();
  const registrants = useGetEventRegistrants();
  const eventData = useGetEvent();
  const webApp = useWebApp();
  //// pagination logic
  const LIMIT = 10; // Adjust the limit as needed
  const [results, setResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  /*
   * Process Registrant (Approve ✅ / Reject ❌)
   */
  const processRegistrantRequest = trpc.events.processRegistrantRequest.useMutation();

  /*
    * Check if the event has payment enabled
   */
  const hasPayment = eventData.data?.has_payment || false;

  /*
   * Export visitor list
   */
  const exportVisitorList = trpc.events.requestExportFile.useMutation({
    onSuccess: () => {
      webApp?.HapticFeedback.impactOccurred("soft");
      webApp?.close();
    },
  });

  const handleApprove = async (user_id: number) => {
    // Perform approval logic
    await processRegistrantRequest.mutateAsync({
      event_uuid: params.hash,
      status: "approved",
      user_id,
    });
  };
  const handleReject = async (user_id: number) => {
    // Perform decline logic

    await processRegistrantRequest.mutateAsync({
      event_uuid: params.hash,
      status: "rejected",
      user_id,
    });
  };

  useMainButton(
    () => {
      exportVisitorList.mutate({
        event_uuid: params.hash,
      });
    },
    "Download List Excel",
    {
      isLoading: exportVisitorList.isLoading,
      disabled: exportVisitorList.isLoading,
    }
  );

  const disablePOAButton = Boolean(  eventData.data?.isNotEnded && eventData.data?.isStarted );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreResults();
        }
      },
      { threshold: 1.0 }
    );

    const lastElement = document.querySelector(".last-guest-item");
    if (lastElement) observer.observe(lastElement);

    return () => {
      if (lastElement) observer.unobserve(lastElement);
    };
  }, [results]);

  // Fetch registrants dynamically based on offset
  const { data, isFetching } = trpc.events.getEventRegistrants.useQuery(
    { event_uuid: params.hash, offset, limit: LIMIT },
    {
      keepPreviousData: true, // Keeps existing data while fetching new data
      onSuccess: (newData) => {
        if (newData) {
          setResults((prev) => [...prev, ...newData]);
          setHasMore(newData.length === LIMIT); // Check if more results are available
        }
        setIsLoading(false);
      },
    }
  );

  const loadMoreResults = () => {
    if (hasMore && !isFetching && !isLoading) {
      setIsLoading(true);
      setOffset((prevOffset) => prevOffset + LIMIT);
    }
  };

  return (
    <>
      <BlockTitle medium>{eventData.data?.title}</BlockTitle>
      <Block className="!-mb-8">
        {eventData.data?.image_url && (
          <EventImage
            url={eventData.data?.image_url}
            width={300}
            height={300}
          />
        )}
        <QrCodeButton
          event_uuid={params.hash}
          url={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${params.hash}`}
          hub={eventData.data?.society_hub?.name!}
        />

        {
          eventData.data?.participationType === "online"
          &&
          ((eventData.data?.enabled && eventData.data?.has_payment) || !eventData.data?.has_payment)
          && (
          <>
            <ButtonPOA
              event_uuid={params.hash}
              poa_type={"password" as EventTriggerType}
              showPOAButton={disablePOAButton}
            />
            {/* Organizer Notification Handler */}
            <OrganizerNotificationHandler />
          </>
        )}
      </Block>

      <BlockTitle medium>
        <span>Guest List</span>
        {eventData.data?.participationType === "in_person" && <ScanRegistrantQRCode />}
      </BlockTitle>

      <BlockHeader className="font-bold">
        {registrants.isSuccess && !registrants.data?.length && (
          <DataStatus
            status="not_found"
            title="No Registrants Yet"
            description="No one has filled the form yet."
          />
        )}
        {registrants.isLoading && (
          <DataStatus
            status="pending"
            title="Loading Guest List"
          />
        )}
        {registrants.isError &&
          (registrants.error.data?.code === "NOT_FOUND" ? (
            <DataStatus
              status="not_found"
              title="Event Not Found"
              description={`Event does not exist with id = ${params.hash}`}
            />
          ) : (
            <DataStatus
              status="danger"
              title="Something Went Wrong"
              description={"There was a problem try refreshing the page"}
            />
          ))}
      </BlockHeader>
      <List>
        {results.map((registrant, idx) => (
          <CustomListItem
            key={`registrant_${idx}`}
            name={registrant.first_name || "No Name"}
            username={registrant.username || "no username"}
            date={
              registrant.created_at
                ? new Date(registrant.created_at).toLocaleString("default", {
                  month: "short",
                  day: "numeric",
                })
                : "no_date"
            }
            registrantInfo={registrant?.registrant_info}
            user_id={registrant.user_id!}
            status={registrant.status}
            handleApprove={() => handleApprove(registrant.user_id!)}
            handleReject={() => handleReject(registrant.user_id!)}
            className={idx === results.length - 1 ? "last-guest-item" : ""}
            hasPayment={hasPayment}

          />
        ))}

        {isFetching && offset !== 0 && <DataStatus status="pending" title="Loading more registrants..." />}
      </List>
    </>
  );
};

export default RegistrationGuestList;
