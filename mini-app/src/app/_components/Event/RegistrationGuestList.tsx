import { KButton } from "@/components/ui/button";
import { cva } from "class-variance-authority";
import {
  List,
  BlockTitle,
  BlockHeader,
  Searchbar,
  ListItem,
  Chip,
} from "konsta/react";
import { Check, Pencil, X } from "lucide-react";
import React, { useState } from "react";

interface CustomListItemProps {
  name: string;
  username: string;
  date: string;
  status: "pending" | "edit" | "approved" | "declined";
  onEdit?: () => void;
  handleApprove: () => Promise<void>;
  handleDecline: () => Promise<void>;
}

const CustomListItem: React.FC<CustomListItemProps> = ({
  name,
  username,
  date,
  status,
  onEdit,
  handleApprove,
  handleDecline,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleEdit = () => {
    // Change status to "pending" and call onEdit if provided
    // You may need to manage this state in the parent component
    if (onEdit) {
      onEdit();
    }
  };

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await handleApprove();
      // Optimistically update the status to "approved"
      // This would typically be managed in the parent component's state
    } catch (error) {
      // Handle error, possibly revert the status change
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeclineClick = async () => {
    setIsDeclining(true);
    try {
      await handleDecline();
      // Optimistically update the status to "declined"
    } catch (error) {
      // Handle error, possibly revert the status change
      console.error("Decline failed:", error);
    } finally {
      setIsDeclining(false);
    }
  };

  let afterContent;
  let footerContent;

  switch (status) {
    case "pending":
      afterContent = (
        <div className="flex flex-col text-xs">
          <span>{date}</span>
          <span>Registered</span>
        </div>
      );
      footerContent = (
        <div className="flex space-x-2">
          <Button
            variant="danger"
            icon={<X size={18} />}
            label="Decline"
            onClick={handleDeclineClick}
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
    case "declined":
      afterContent = (
        <div className="flex space-x-2">
          <Button
            icon={<Pencil size={18} />}
            onClick={handleEdit}
          />
          <StatusChip
            variant="danger"
            label="Declined"
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
        <div>
          <h4>{name}</h4>
          <p className="text-xs text-muted-foreground">{username}</p>
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
  const variantStyles = cva(className, {
    variants: {
      variant: {
        primary: "bg-blue-400 text-blue-600 active:bg-blue-700",
        secondary: "bg-gray-500 text-gray-500 active:bg-gray-600",
        danger: "bg-red-500 text-red-500 active:bg-red-600",
        success: "bg-green-400 text-green-700 active:bg-green-600",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  });

  return (
    <KButton
      rounded
      className={variantStyles({ variant })}
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
}

const StatusChip: React.FC<StatusChipProps> = ({ variant, label }) => {
  const variantStyles = cva("", {
    variants: {
      variant: {
        primary: "bg-blue-500 text-blue-500",
        success: "bg-green-500 text-green-600",
        danger: "bg-red-500 text-red-500",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  });

  return <Chip className={variantStyles({ variant })}>{label}</Chip>;
};

const RegistrationGuestlist = () => {
  // Mock data and functions for demonstration purposes
  const handleApprove = async () => {
    // Perform approval logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleDecline = async () => {
    // Perform decline logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <>
      <BlockTitle medium>Guest List</BlockTitle>
      <BlockHeader className="!px-2">
        <Searchbar clearButton />
      </BlockHeader>
      <List
        strong
        title="Guest List"
      >
        <CustomListItem
          name="Guest Name 1"
          username="@guest1"
          date="14 Nov"
          status="pending"
          handleApprove={handleApprove}
          handleDecline={handleDecline}
        />
        <CustomListItem
          name="Guest Name 3"
          username="@guest3"
          date="16 Nov"
          status="approved"
          handleApprove={handleApprove}
          handleDecline={handleDecline}
        />
        <CustomListItem
          name="Guest Name 4"
          username="@guest4"
          date="17 Nov"
          status="declined"
          handleApprove={handleApprove}
          handleDecline={handleDecline}
        />
      </List>
    </>
  );
};

export default RegistrationGuestlist;
