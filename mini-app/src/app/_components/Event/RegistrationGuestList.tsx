import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { useGetEventRegistrants } from "@/hooks/events.hooks";
import { cn } from "@/utils";
import { cva } from "class-variance-authority";
import { List, BlockTitle, ListItem, Chip, BlockHeader } from "konsta/react";
import { Check, Pencil, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";

interface CustomListItemProps {
  name: string;
  username: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  user_id: number;
  handleApprove: (_: number) => Promise<void>;
  handleReject: (_: number) => Promise<void>;
}

const CustomListItem: React.FC<CustomListItemProps> = ({
  name,
  username,
  date,
  status,
  user_id,
  handleApprove,
  handleReject,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [itemStatus, setItemStatus] = useState(status);

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
      console.error("Approval failed:", error);
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
      console.error("Reject failed:", error);
    } finally {
      setIsDeclining(false);
    }
  };

  let afterContent;
  let footerContent;

  switch (itemStatus) {
    case "pending":
      afterContent = (
        <div className="flex flex-col text-end text-xs">
          <span>{date}</span>
          <span>Registered</span>
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
    case "approved":
      afterContent = (
        <div className="flex space-x-2">
          <Button
            icon={<Pencil size={18} />}
            onClick={handleEdit}
          />
          <StatusChip
            variant="success"
            label="Approved"
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

  return (
    <ListItem
      className="!ps-0"
      title={
        <div className="w-44">
          <h4 className="truncate">{name}</h4>
          <p className="text-xs truncate text-cn-muted-foreground">
            {username}
          </p>
        </div>
      }
      after={afterContent}
      footer={footerContent}
    />
  );
};

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "success";
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  icon,
  label,
  onClick,
  isLoading,
  className,
}) => {
  const variantStyles = cva("", {
    variants: {
      variant: {
        primary: "",
        secondary: "k-color-brand-gray",
        danger: "k-color-brand-red",
        success: "k-color-brand-green",
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

interface StatusChipProps {
  variant: "primary" | "success" | "danger";
  label: string;
  className?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({
  variant,
  label,
  className,
}) => {
  const variantStyles = cva("", {
    variants: {
      variant: {
        primary: "bg-blue-500 text-blue-600",
        success: "bg-green-500 text-green-700",
        danger: "bg-red-500 text-red-600",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  });

  return (
    <Chip className={cn(variantStyles({ variant, className }))}>{label}</Chip>
  );
};

const RegistrationGuestlist = () => {
  /*
   * Get Event Registrants
   */
  const params = useParams<{ hash: string }>();
  const registrants = useGetEventRegistrants();

  /*
   * Process Registrant (Approve ✅ / Reject ❌)
   */
  const processRegistrantRequest =
    trpc.events.processRegistrantRequest.useMutation();

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

  return (
    <>
      <BlockTitle medium>Guest List</BlockTitle>
      {/* <BlockHeader className="!px-2"> */}
      {/*   <Searchbar clearButton /> */}
      {/* </BlockHeader> */}
      <BlockHeader className="font-bold">
        {/* TODO: Better UI for state handling */}
        {registrants.isSuccess &&
          !registrants.data?.length &&
          "No Registrants Yet 😶"}
        {registrants.isLoading && "Loading Registrants List 🏗"}
        {registrants.isError &&
          (registrants.error.data?.code === "NOT_FOUND"
            ? "Event Not Found 🔎"
            : "There was a problem try refreshing the page ⚠️")}
      </BlockHeader>
      <List
        strong
        title="Guest List"
      >
        {registrants.data?.map((registrant) => (
          <CustomListItem
            key={registrant.id}
            name={registrant.user_id?.toString() || "user_id"}
            username={registrant.user_id?.toString() || "user_id"}
            date={
              registrant.created_at
                ? new Date(registrant.created_at).toLocaleString("default", {
                    month: "short",
                    day: "numeric",
                  })
                : "no_date"
            }
            user_id={registrant.user_id!}
            status={registrant.status as "approved" | "rejected" | "pending"}
            handleApprove={handleApprove}
            handleReject={handleReject}
          />
        ))}
      </List>
    </>
  );
};

export default RegistrationGuestlist;
