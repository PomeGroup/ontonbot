"use client";

import { ErrorState } from "@/app/_components/ErrorState";
import { EventDataPage } from "@/app/_components/Event/EventPage";

type Props = { params: { hash: string } };

export default function EventPage({ params }: Props) {
  if (params.hash.length !== 36) {
    return <ErrorState errorCode="event_not_found" />;
  }

  return <EventDataPage eventHash={params.hash} />;
}
