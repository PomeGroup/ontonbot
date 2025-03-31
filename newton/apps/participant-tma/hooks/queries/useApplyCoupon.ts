import { useMutation } from "@tanstack/react-query";
import { checkCoupon } from "~/services/event.services";

export const useApplyCoupon = () => {
  return useMutation({
    mutationFn: ({ eventId, discountCode }: { eventId: number; discountCode: string }) => checkCoupon(eventId, discountCode),
  });
};
