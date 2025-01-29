"use client";

import React from "react";
import { Page, Block } from "konsta/react";
import EventOrders from "@/app/_components/Event/Orders/Orders";

export default function OrdersPage() {
  return (
    <Page>
      <Block>
        <h1 className="text-lg font-bold">Event Orders</h1>
      </Block>
      {/* We can use `eventData` if needed, or just show <EventOrders/> */}
      <EventOrders />
    </Page>
  );
}
