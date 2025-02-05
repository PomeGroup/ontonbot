import { RouterOutput } from "@/server";
import RegistrationGuestList from "../../Event/RegistrationGuestList";
import NonRegistrationGuestList from "../../Event/NonRegistrationGuestList";
import { useGetEvent } from "@/hooks/events.hooks";

interface Props {
  event: RouterOutput["events"]["getEvent"];
  params: {
    hash: string;
  };
}

const GuestList = (props: Props) => {
  // this will not refetch (it will fetch once)
  const event = useGetEvent();

  return event.data?.has_registration ? <RegistrationGuestList /> : <NonRegistrationGuestList {...props} />;
};

export default GuestList;
