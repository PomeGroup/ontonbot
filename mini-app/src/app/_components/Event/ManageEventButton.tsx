import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import { Pencil } from "lucide-react";
import { useUserStore } from "@/context/store/user.store";
import { canUserManageEvent } from "@/lib/userRolesUtils";
import { Button, Card } from "konsta/react";

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
    <Card>
      <Button
        onClick={() => {
          router.push(`/events/${eventHash}/manage`);
        }}
        large
        className="rounded-2lg"
        outline
      >
        <div className="flex gap-2 items-center">
          <Pencil />
          <span>Manage Event</span>
        </div>
      </Button>
    </Card>
  );
};
