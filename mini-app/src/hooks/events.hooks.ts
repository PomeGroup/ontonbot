import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";

/**
 * @param event_hash - if not provided will use current page hash for the event_uuid
 * @param offset
 * @param limit
 */
export function useGetEventRegistrants(event_hash?: string, offset = 0, limit = 10, search?: string) {
  const params = useParams<{ hash: string }>();
  const event_uuid = event_hash ?? params.hash;

  return trpc.registrant.getEventRegistrants.useQuery(
    {
      event_uuid,
      offset,
      limit,
      search, // pass the search term to the query
    },
    {
      staleTime: 10_000,
      queryKey: ["registrant.getEventRegistrants", { event_uuid, offset, limit, search }],
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
  return trpc.hubs.getHubs.useQuery(undefined, {
    staleTime: Infinity,
    queryKey: ["hubs.getHubs", undefined],
  });
}

/**
 * get hubs for manage event
 */
export function useGetHubsManageEvent() {
  return trpc.hubs.getOrgHubs.useQuery(undefined, {
    staleTime: Infinity,
    queryKey: ["hubs.getOrgHubs", undefined],
  });
}
export function useGetEventOrders() {
  const params = useParams<{ hash: string }>();

  return trpc.orders.getEventOrders.useQuery(
    {
      event_uuid: params.hash,
    },
    {
      staleTime: Infinity,
      refetchInterval: 30_000,
      queryKey: ["orders.getEventOrders", { event_uuid: params.hash }],
    }
  );
}
