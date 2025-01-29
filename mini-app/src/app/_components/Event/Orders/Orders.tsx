import { Button, ListItem } from "konsta/react";
import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { useGetEventOrders } from "@/hooks/events.hooks";
import { SiTon } from "react-icons/si";
import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useConfig } from "@/context/ConfigContext";
import { beginCell, toNano } from "@ton/core";
import { toast } from "sonner";
import { useUpdateOrder } from "@/hooks/orders.hooks";
import { useParams } from "next/navigation";
import DataStatus from "../../molecules/alerts/DataStatus";

const EventOrders = () => {
  const params = useParams<{ hash: string }>();

  const updateOrder = useUpdateOrder({ event_uuid: params.hash });
  const orders = useGetEventOrders();

  const config = useConfig();

  /**
   * TON Connect
   */
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

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
        {orders.data?.filter((o) => o.state === "new").length === 0 && (
          <DataStatus
            status="not_found"
            description="No new orders found"
          />
        )}
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
                          Increase event capacity by <b>{order.total_price / 0.06}</b> tickets
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
                                  updateOrder.mutate({
                                    state: "confirming",
                                    order_uuid: order.uuid,
                                  });
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
        {orders.data?.filter((o) => o.state !== "new").length === 0 && (
          <DataStatus
            status="not_found"
            description="No orders found"
          />
        )}
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
                          Increase event capacity by <b>{order.total_price / 0.06}</b> tickets
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
