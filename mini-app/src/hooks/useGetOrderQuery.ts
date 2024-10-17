import { useQuery } from "@tanstack/react-query";

import { getOrder } from "@/services/orders.services";

export function useGetOrder(order_id: string, noRefetch = false) {
  return useQuery({
    queryKey: ["get_order", order_id],
    queryFn: () => getOrder({ order_id }),
    refetchInterval: noRefetch ? undefined : 1000,
  });
}
