import { useMutation } from "@tanstack/react-query";
import { toast } from "@ui/base/sonner";

import { addOrder } from "~/services/orders.services";

export function useAddOrderMutation() {
  return useMutation({
    mutationFn: addOrder,
    retry: 2,
    onError(error) {
      toast.error(error.message);
    },
  });
}
