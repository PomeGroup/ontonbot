"use client";

import { trpc } from "@/app/_trpc/client";
import EditForm from "./EditForm";

export default function EditOrganizerPage() {
  const { data } = trpc.organizers.getOrganizer.useQuery({});

  if (!data) return null;

  return <EditForm data={data} />;
}
