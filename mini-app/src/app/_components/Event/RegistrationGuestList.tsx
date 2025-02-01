import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { useGetEvent, useGetEventRegistrants } from "@/hooks/events.hooks";
import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { List, BlockTitle, ListItem, BlockHeader, Sheet, BlockFooter, Block } from "konsta/react";
import { Check, FileUser, Pencil, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataStatus from "../molecules/alerts/DataStatus";
import { createPortal } from "react-dom";
import QrCodeButton from "../atoms/buttons/QrCodeButton";
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
  registrantInfo: Record<string, string>;
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

  const handleEdit = useCallback(() => {
    // Change status to "pending"
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleApproveClick = useCallback(async () => {
    setIsApproving(true);
    try {
      await handleApprove(user_id);
      // Optimistically update the status to "approved"
      setItemStatus("approved");
      setIsEditing(false);
    } catch (error) {
      // console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  }, [handleApprove, user_id]);

  const handleRejectClick = useCallback(async () => {
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
  }, [handleReject, user_id]);

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
            {!hasPayment && itemStatus === "approved" && (
              <Button
                icon={<Pencil size={18} />}
                onClick={handleEdit}
              />
            )}
            <StatusChip
              variant={itemStatus === "checkedin" ? "primary" : "success"}
              label={itemStatus}
            />
          </div>
        );
        footerContent =
          hasPayment || itemStatus === "checkedin" || !isEditing ? null : (
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
        footerContent =
          hasPayment || !isEditing ? null : (
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
  }, [
    itemStatus,
    date,
    hasPayment,
    handleRejectClick,
    isDeclining,
    handleApproveClick,
    isApproving,
    handleEdit,
    isEditing,
    registrantInfo,
  ]);

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
            {Object.entries(registrantInfo).map(([key, value], idx) => {
              return (
                <ListItem
                  key={idx}
                  title={<div className="capitalize">{key.split("_").join(" ")}</div>}
                  subtitle={value || <p className="text-cn-muted-foreground">Not Provided</p>}
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
  const params = useParams<{ hash: string }>();
  // search state
  const [search, setSearch] = useState("");

  // pagination state and other states
  const LIMIT = 10;
  const [results, setResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get event data and registrants with search
  const registrantsQuery = useGetEventRegistrants(params.hash, offset, LIMIT, search);
  const eventData = useGetEvent();
  const webApp = useWebApp();

  const processRegistrantRequest = trpc.registrant.processRegistrantRequest.useMutation();

  const hasPayment = eventData.data?.has_payment || false;

  const exportVisitorList = trpc.telegramInteractions.requestExportFile.useMutation({
    onSuccess: () => {
      webApp?.HapticFeedback.impactOccurred("soft");
      webApp?.close();
    },
  });

  const handleApprove = async (user_id: number) => {
    await processRegistrantRequest.mutateAsync({
      event_uuid: params.hash,
      status: "approved",
      user_id,
    });
  };

  const handleReject = async (user_id: number) => {
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

  const disablePOAButton = Boolean(eventData.data?.isNotEnded && eventData.data?.isStarted);

  // Reset pagination when the search term changes
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  useEffect(() => {
    const loadMoreResults = () => {
      if (hasMore && !isLoading) {
        setIsLoading(true);
        setOffset((prevOffset) => prevOffset + LIMIT);
      }
    };

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
  }, [results, hasMore, isLoading]);

  // When new data is fetched, update results
  useEffect(() => {
    if (registrantsQuery.data) {
      if (offset === 0) {
        setResults(registrantsQuery.data);
      } else {
        setResults((prev) => [...prev, ...registrantsQuery.data!]);
      }
      setHasMore(registrantsQuery.data.length === LIMIT);
      setIsLoading(false);
    }
  }, [offset, registrantsQuery.data]);

  return (
    <>
      <BlockTitle medium>{eventData.data?.title}</BlockTitle>
      <Block className="!-mb-8">
        <QrCodeButton
          event_uuid={params.hash}
          url={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${params.hash}`}
          hub={eventData.data?.society_hub?.name!}
        />

        {eventData.data?.participationType === "online" &&
          ((eventData.data?.enabled && eventData.data?.has_payment) || !eventData.data?.has_payment) && (
            <>
              <ButtonPOA
                event_uuid={params.hash}
                poa_type={"password" as EventTriggerType}
                showPOAButton={disablePOAButton}
              />
              <OrganizerNotificationHandler />
            </>
          )}
      </Block>

      <BlockTitle medium>
        <span>Guest List</span>
        {eventData.data?.participationType === "in_person" && <ScanRegistrantQRCode />}
      </BlockTitle>

      {/* Search input */}
      <Block>
        <input
          type="text"
          placeholder="Search by username or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </Block>

      <BlockHeader className="font-bold">
        {registrantsQuery.isSuccess && !registrantsQuery.data?.length && (
          <DataStatus
            status="not_found"
            title="No Registrants Yet"
            description="No one has filled the form yet."
          />
        )}
        {registrantsQuery.isLoading && (
          <DataStatus
            status="pending"
            title="Loading Guest List"
          />
        )}
        {registrantsQuery.isError &&
          (registrantsQuery.error.data?.code === "NOT_FOUND" ? (
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

        {isLoading && offset !== 0 && (
          <DataStatus
            status="pending"
            title="Loading more registrants..."
          />
        )}
      </List>
    </>
  );
};
export default RegistrationGuestList;
