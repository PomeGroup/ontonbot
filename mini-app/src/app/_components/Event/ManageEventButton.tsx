import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export const ManageEventButton = () => {
  const { authorized, role, user } = useAuth();
  const { eventData, eventHash } = useEventData();
  const router = useRouter();

  if (authorized && (role === "admin" || user?.user_id === eventData.data?.owner)) {
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
