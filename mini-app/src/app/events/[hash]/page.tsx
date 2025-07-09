"use client";

import { ErrorState } from "@/app/_components/ErrorState";
import { EventDataPage } from "@/app/_components/Event/EventPage";
import { useParams } from "next/navigation";

export default function EventPage() {
  const params = useParams<{ hash: string }>();
  if (params.hash.length !== 36) {
    return <ErrorState errorCode="event_not_found" />;
  }

  return <EventDataPage eventHash={params.hash} />;
}
