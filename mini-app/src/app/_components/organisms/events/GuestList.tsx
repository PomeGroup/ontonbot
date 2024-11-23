import { RouterOutput } from "@/server";
import { useWithBackButton } from "../../atoms/buttons/web-app/useWithBackButton";
import RegistrationGuestlist from "../../Event/RegistrationGuestList";
import NonRegistrationGuestList from "../../Event/NonRegistrationGuestList";
import { useGetEvent } from "@/hooks/events.hooks";

interface Props {
  event: RouterOutput["events"]["getEvent"];
  params: {
    hash: string;
  };
}

const GuestList = (props: Props) => {
  useWithBackButton({
    whereTo: "/",
  });

  // this will not refetch (it will fetch once)
  const event = useGetEvent();

  return event.data?.has_registration ? (
    <RegistrationGuestlist />
  ) : (
    <NonRegistrationGuestList {...props} />
  );
};

export default GuestList;
