"use client";

import Alerts from "@/app/_components/molecules/alerts";
import ManageEvent from "@/app/_components/organisms/events/ManageEvent";
import useAuth from "@/hooks/useAuth";
import { Page } from "konsta/react";


export default function CreateEventAdminPage ()  {
  const { authorized, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }


  return (
    <Page className="min-h-screen">
      <ManageEvent />
    </Page>
  );
};


