import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";

/**
 * @param event_hash - if not provided will use current page hash for the event_uuid
 */
export function useGetEventRegistrants(event_hash?: string) {
  const params = useParams<{ hash: string }>();
  const event_uuid = event_hash ?? params.hash;

  return trpc.events.getEventRegistrants.useQuery(
    {
      event_uuid,
    },
    {
      staleTime: 10_000,
      queryKey: ["events.getEventRegistrants", { event_uuid }],
    }
  );
}

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
      staleTime: Infinity,
      queryKey: ["events.getEvent", { event_uuid }],
    }
  );
}

/**
 * get hubs
 */
export function useGetHubs() {
  return trpc.events.getHubs.useQuery(undefined, {
    staleTime: 5000,
    queryKey: ["events.getHubs", undefined],
  });
}
