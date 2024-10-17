import { addOrder } from "@/services/orders.services";
import { useMutation } from "@tanstack/react-query";

export function useAddOrderMutation() {
  return useMutation({
    mutationFn: addOrder,
    retry: 2,
  });
}
