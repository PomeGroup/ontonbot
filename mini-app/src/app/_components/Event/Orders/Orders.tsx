import { Button, ListItem } from "konsta/react";
import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { useGetEventOrders } from "@/hooks/events.hooks";
import { SiTon } from "react-icons/si";
import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useConfig } from "@/context/ConfigContext";
import { beginCell, toNano } from "@ton/core";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";

const EventOrders = () => {
  const orders = useGetEventOrders();
  const updateOrder = {
    mutate: async () => undefined,
  };

  const { config } = useConfig();
  const trpcUtils = trpc.useUtils();

  /**
   * TON Connect
   */
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

  const changeOrderState = (order_uuid: string) => {
    // update state server side
    updateOrder.mutate();
    // update state client side (optimistic)
    trpcUtils.events.getEventOrders.setData(
      {
        event_uuid: order_uuid,
      },
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) => (item.uuid === order_uuid ? { ...item, state: "confirming" } : item));
      }
    );
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <TonConnectButton />
      </div>

      <ListLayout
        isLoading={orders.isLoading}
        isEmpty={orders.data?.length === 0 || orders.isError}
        title="Orders List"
        label={{
          text: "New",
          variant: "danger",
        }}
      >
        {orders.data
          ?.filter((o) => o.state === "new")
          .map((order) => {
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
                    {order.state === "new" && (
                      <Button
                        onClick={() => {
                          tonWallet?.account.address
                            ? // FIXME: support for usdt
                              tonConnectUI
                                .sendTransaction({
                                  validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                                  messages: [
                                    {
                                      amount: toNano(order.total_price).toString(),
                                      address: config.ONTON_WALLET_ADDRESS!,
                                      payload: beginCell()
                                        .storeUint(0, 32)
                                        .storeStringTail(`onton_order=${order.uuid}`)
                                        .endCell()
                                        .toBoc()
                                        .toString("base64"),
                                    },
                                  ],
                                })
                                .then(() => {
                                  toast("Please wait until we confirm the transaction and do not pay again");
                                  changeOrderState(order.uuid);
                                })
                            : tonConnectUI.openModal();
                        }}
                      >
                        {tonConnectUI.account?.address ? "Pay" : "Connect Wallet"}
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
      <ListLayout
        isLoading={orders.isLoading}
        isEmpty={orders.data?.length === 0 || orders.isError}
        title="Orders List"
        label={{
          text: "Other",
          variant: "primary",
        }}
      >
        {orders.data
          ?.filter((o) => o.state !== "new")
          .map((order) => {
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
    </>
  );
};

export default EventOrders;
