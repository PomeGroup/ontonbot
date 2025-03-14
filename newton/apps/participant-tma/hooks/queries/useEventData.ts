import { useQuery } from "@tanstack/react-query";
import { useTonWallet } from "@tonconnect/ui-react";
import { useContext } from "react";
import { TonProofContext } from "~/components/TonProofProvider";
import { getEventWithUserData } from "~/services/event.services";

export const useEventData = (id: string) => {
  const connectedWallet = useTonWallet();
  const { token } = useContext(TonProofContext);

  return useQuery({
    queryFn: () =>
      getEventWithUserData(id, {
        proof_token: token!,
      }),
    queryKey: ["get-event-data-only", id, connectedWallet?.account.address],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
  });
};
