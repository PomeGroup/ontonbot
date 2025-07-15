"use client";

import { EventDataPage } from "@/app/_components/Event/EventPage";
import { useParams } from "next/navigation";

export default function EventPage() {
  const params = useParams<{ hash: string }>();

  return <EventDataPage eventHash={params.hash} />;
}
