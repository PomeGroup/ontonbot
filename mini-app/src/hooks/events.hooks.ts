import { trpc } from "@/app/_trpc/client";
import { EventRegistrantStatusType } from "@/db/schema/eventRegistrants";
import { useParams } from "next/navigation";

/**
 * @param event_hash - if not provided will use current page hash for the event_uuid
 * @param offset
 * @param limit
 */
export function useGetEventRegistrants(
  event_hash?: string,
  limit = 10,
  search?: string,
  statuses: EventRegistrantStatusType[] = []
) {
  const params = useParams<{ hash: string }>();
  const event_uuid = event_hash ?? params.hash;

  return trpc.registrant.getEventRegistrants.useQuery(
    {
      event_uuid,
      limit,
      search: search || undefined,
      statuses: statuses.length ? statuses : undefined,
    },
    {
      staleTime: 10_000,
      queryKey: ["registrant.getEventRegistrants", { event_uuid, limit, search, statuses }],
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
      // after 2s data is considered stale and <<when>> the hook is used again will be refetched
      staleTime: 2_000,
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
