import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useUserStore } from "@/context/store/user.store";
import { canUserManageEvent } from "@/lib/userRolesUtils";

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

  if (canManageEvent) {
    return (
      <Button
        onClick={() => {
          router.push(`/events/${eventHash}/manage`);
        }}
        variant={"primary"}
        className="w-full"
      >
        <div className="flex gap-2 items-center">
          <Pencil />
          <span>Manage Event</span>
        </div>
      </Button>
    );
  }
  return null;
};
