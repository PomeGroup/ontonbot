import { ListItem } from "konsta/react";
import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { useGetEventOrders } from "@/hooks/events.hooks";

const EventOrders = () => {
  const orders = useGetEventOrders();

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
            title={order.total_price}
          />
        );
      })}
    </ListLayout>
  );
};

export default EventOrders;
