// import { trpc } from "@/app/_trpc/client";
//
// export const useUpdateOrder = (props: { event_uuid: string }) => {
//   const trpcUtils = trpc.useUtils();
//
//   return trpc.orders.updateOrderState.useMutation({
//     onMutate: async ({ order_uuid }) => {
//       trpcUtils.orders.invalidate();
//       await trpcUtils.events.getEventOrders.cancel();
//       const previuesData = trpcUtils.events.getEventOrders.getData();
//
//       trpcUtils.events.getEventOrders.setData({ event_uuid: props.event_uuid }, (oldData) => {
//         if (!oldData) {
//           return oldData;
//         }
//
//         return oldData.map((item) => (item.uuid === order_uuid ? { ...item, state: "confirming" } : item));
//       });
//
//       return { previuesData };
//     },
//     onError: (_err, _newState, context) => {
//       trpcUtils.events.getEventOrders.setData({ event_uuid: props.event_uuid }, context?.previuesData);
//     },
//     onSettled: () => {
//       void trpcUtils.events.getEventOrders.invalidate();
//     },
//   });
// };
