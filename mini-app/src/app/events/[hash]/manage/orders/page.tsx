"use client";

import React from "react";
import { Page, Block } from "konsta/react";
import { useManageEventContext } from "../../../../../context/ManageEventContext";
import EventOrders from "@/app/_components/Event/Orders/Orders";

export default function OrdersPage() {
  const { eventData } = useManageEventContext();

  return (
    <Page>
      <Block className="px-4 pt-4">
        <h1 className="text-lg font-bold">Event Orders</h1>
      </Block>
      {/* We can use `eventData` if needed, or just show <EventOrders/> */}
      <EventOrders />
    </Page>
  );
}
