"use client";

import { EventDataPage } from "@/app/_components/Event/EventPage";

type Props = { params: { hash: string } };

export default function EventPage({ params }: Props) {
  if (params.hash.length !== 36) {
    return <div>Incorrect event link. Startapp param should be 36 characters long</div>;
  }

  return <EventDataPage eventHash={params.hash} />;
}
