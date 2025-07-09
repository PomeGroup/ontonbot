"use client";;
import { use } from "react";

import { ErrorState } from "@/app/_components/ErrorState";
import { EventDataPage } from "@/app/_components/Event/EventPage";

type Props = { params: Promise<{ hash: string }> };

export default function EventPage(props: Props) {
  const params = use(props.params);
  if (params.hash.length !== 36) {
    return <ErrorState errorCode="event_not_found" />;
  }

  return <EventDataPage eventHash={params.hash} />;
}
