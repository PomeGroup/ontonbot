import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { useGetEvent, useGetEventRegistrants } from "@/hooks/events.hooks";
import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { List, BlockTitle, ListItem, BlockHeader, Sheet, BlockFooter, Block } from "konsta/react";
import { Check, FileUser, Pencil, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import DataStatus from "../molecules/alerts/DataStatus";
import { createPortal } from "react-dom";
import QrCodeButton from "../atoms/buttons/QrCodeButton";
import EventImage from "../atoms/images/EventImage";
import { useMainButton } from "@/hooks/useMainButton";
import useWebApp from "@/hooks/useWebApp";
import ScanRegistrantQRCode from "./ScanRegistrantQRCode";
import StatusChip from "@/components/ui/status-chips";

interface CustomListItemProps {
  name: string;
  username: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "checkedin";
  user_id: number;
  registrantInfo: any;
  handleApprove: (_: number) => Promise<void>;
  handleReject: (_: number) => Promise<void>;
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
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [itemStatus, setItemStatus] = useState(status);
  const [showRegistrantInfo, setShowRegistrantInfo] = useState<any>(null);

  const handleEdit = () => {
    // Change status to "pending"
    setItemStatus("pending");
  };

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await handleApprove(user_id);
      // Optimistically update the status to "approved"
      // This would typically be managed in the parent component's state
      setItemStatus("approved");
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
        footerContent = (
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
              icon={<Pencil size={18} />}
              onClick={handleEdit}
            />
            <Button
              icon={<FileUser size={18} />}
              variant="purple"
              onClick={() => {
                setShowRegistrantInfo(registrantInfo);
              }}
            />
            <StatusChip
              variant={itemStatus === "checkedin" ? "primary" : "success"}
              label={itemStatus}
            />
          </div>
        );
        footerContent = null;
        break;

      case "rejected":
        afterContent = (
          <div className="flex space-x-2">
            <Button
              icon={<Pencil size={18} />}
              onClick={handleEdit}
            />
            <Button
              icon={<FileUser size={18} />}
              variant="purple"
              onClick={() => {
                setShowRegistrantInfo(registrantInfo);
              }}
            />
            <StatusChip
              variant="danger"
              label="Rejected"
            />
          </div>
        );
        footerContent = null;
        break;
      default:
        afterContent = null;
        footerContent = null;
    }
    return {
      afterContent,
      footerContent,
    };
  }, [itemStatus]);

  return (
    <>
      <ListItem
        className="!ps-0"
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

const RegistrationGuestlist = () => {
  /*
   * Get Event Registrants
   */
  const params = useParams<{ hash: string }>();
  const registrants = useGetEventRegistrants();
  const eventData = useGetEvent();
  const webApp = useWebApp();

  /*
   * Process Registrant (Approve ✅ / Reject ❌)
   */
  const processRegistrantRequest = trpc.events.processRegistrantRequest.useMutation();

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
          hub={eventData.data?.society_hub.name!}
        />
      </Block>
      <BlockTitle medium>
        <span>Guest List</span>
        {eventData.data?.participationType === "in_person" && <ScanRegistrantQRCode />}
      </BlockTitle>

      {/* <BlockHeader className="!px-2"> */}
      {/*   <Searchbar clearButton /> */}
      {/* </BlockHeader> */}
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
      <List
        strong
        title="Guest List"
      >
        {registrants.data?.map((registrant, idx) => (
          <CustomListItem
            key={"registrant_" + idx}
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
            registrantInfo={registrant.regisrtant_info}
            user_id={registrant.user_id!}
            status={registrant.status}
            handleApprove={handleApprove}
            handleReject={handleReject}
          />
        ))}
      </List>
    </>
  );
};

export default RegistrationGuestlist;
