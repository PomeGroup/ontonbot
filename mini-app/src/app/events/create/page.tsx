"use client";

import Alerts from "@/app/_components/molecules/alerts";
import { ManageEvent } from "@/app/_components/organisms/events";
import useAdminAuth from "@/hooks/useAdminAuth";

const CreateEventAdminPage = () => {
  const { authorized, isLoading } = useAdminAuth();

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  return <main><ManageEvent /></main>;
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
