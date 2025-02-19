import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import { Pencil } from "lucide-react";
import { useUserStore } from "@/context/store/user.store";
import { canUserManageEvent } from "@/lib/userRolesUtils";
import CustomButton from "../Button/CustomButton";
import CustomCard from "../atoms/cards/CustomCard";

export const ManageEventButton = () => {
  const { eventData, eventHash } = useEventData();
  const router = useRouter();

  const { user } = useUserStore();
  const canManageEvent = canUserManageEvent(user, {
    data: {
      owner: eventData?.data?.owner,
      accessRoles: eventData?.data?.accessRoles,
    },
  });

  if (!canManageEvent) {
    return null;
  }

  return (
    <CustomCard defaultPadding>
      <CustomButton
        onClick={() => {
          router.push(`/events/${eventHash}/manage`);
        }}
        variant="outline"
      >
        <div className="flex gap-2 items-center">
          <Pencil />
          <span>Manage Event</span>
        </div>
      </CustomButton>
    </CustomCard>
  );
};
