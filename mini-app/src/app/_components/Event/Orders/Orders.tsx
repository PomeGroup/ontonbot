import { Button, ListItem } from "konsta/react";
import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { useGetEventOrders } from "@/hooks/events.hooks";
import { SiTon } from "react-icons/si";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useConfig } from "@/context/ConfigContext";
import { toNano } from "@ton/core";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";

const EventOrders = () => {
  const orders = useGetEventOrders();
  const [tonConnectUI] = useTonConnectUI();
  const { config } = useConfig();
  const trpcUtils = trpc.useUtils();

  return (
    <ListLayout
      isLoading={orders.isLoading}
      isEmpty={orders.data?.length === 0 || orders.isError}
      title="Orders List"
    >
      {orders.data?.map((order) => {
        return (
          <ListItem
            key={order.uuid}
            /**
             * ORDER TITLE
             */
            title={
              <span className="flex gap-2 items-center">
                <b className="font-extrabold antialiased">{order.total_price}</b> <SiTon className="text-sky-600" />
              </span>
            }
            /**
             * ORDER DESCRIPTION
             */
            footer={
              <div className="flex flex-col mt-2 gap-2">
                <p className="capitalize ">
                  <b className="font-semibold antialiased">{order.order_type.replaceAll("_", " ")}</b>:{" "}
                  {order.order_type === "event_creation" && (
                    <span>Event won&#39;t be created unless this order is paid</span>
                  )}
                  {order.order_type === "event_capacity_increment" && (
                    <span>
                      Increase event capacity by <b>{order.total_price / 0.055}</b> tickets
                    </span>
                  )}
                </p>
                {order.state === "created" && (
                  <Button
                    onClick={() => {
                      tonConnectUI
                        .sendTransaction({
                          validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                          messages: [
                            {
                              amount: toNano(order.total_price).toString(),
                              address: config.ONTON_WALLET_ADDRESS!,
                              payload: `onton_order=${order.uuid}`,
                            },
                          ],
                        })
                        .then(() => {
                          toast("Please wait until we confirm the transaction and do not pay again");
                          trpcUtils.events.getEventOrders.setData(
                            {
                              event_uuid: order.uuid,
                            },
                            (oldData) => {
                              if (!oldData) return oldData;
                              return oldData.map((item) =>
                                item.uuid === order.uuid ? { ...item, state: "processing" } : item
                              );
                            }
                          );
                        });
                    }}
                  >
                    Pay
                  </Button>
                )}
              </div>
            }
            /**
             * HANDLE ORDER STATUS
             */
            after={<p className="capitalize">{order.state}</p>}
          />
        );
      })}
    </ListLayout>
  );
};

export default EventOrders;
