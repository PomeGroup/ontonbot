import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useUserStore } from "@/context/store/user.store";

export const ManageEventButton = () => {
  const { eventData, eventHash } = useEventData();
  const router = useRouter();

  const { user } = useUserStore()

  if (user?.role === "admin" || user?.user_id === eventData.data?.owner) {
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
