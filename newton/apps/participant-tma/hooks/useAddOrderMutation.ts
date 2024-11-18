import { useMutation } from "@tanstack/react-query";

import { addOrder } from "~/services/orders.services";

export function useAddOrderMutation() {
  return useMutation({
    mutationFn: addOrder,
    retry: 2,
  });
}
