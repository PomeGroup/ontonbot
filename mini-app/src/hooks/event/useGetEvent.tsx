import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";

/**
 * @param event_hash - if not provided will use current page hash for the event_uuid
 */
export function useGetEvent(event_hash?: string) {
  const params = useParams<{ hash: string }>();

  const event_uuid = event_hash ?? params.hash;

  return trpc.events.getEvent.useQuery(
    { event_uuid },
    {
      // after 10s data is considered stale and <<when>> the hook is used again will be refetched
      staleTime: 10_000,
      queryKey: ["events.getEvent", { event_uuid }],
    }
  );
}
