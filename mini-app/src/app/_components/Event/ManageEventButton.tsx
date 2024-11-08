import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEventData } from "./eventPageContext";
import MainButton from "../atoms/buttons/web-app/MainButton";

export const ManageEventButton = () => {
  const { authorized, role, user } = useAuth();
  const { eventData, eventHash } = useEventData()
  const router = useRouter();

  if (
    authorized &&
    (role === "admin" || user?.user_id === eventData.data?.owner)
  ) {
    return (
      <MainButton
        text="Manage Event"
        onClick={() => {
          router.push(`/events/${eventHash}/edit`);
        }}
      />
    );
  }
  return null;
};
