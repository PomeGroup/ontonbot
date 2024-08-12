"use client";

import Alerts from "@/app/_components/molecules/alerts";
import { ManageEvent } from "@/app/_components/organisms/events";
import useAuth from "@/hooks/useAuth";

const CreateEventAdminPage = () => {
  const { authorized, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  return <ManageEvent />;
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
