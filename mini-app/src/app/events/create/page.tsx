"use client";

import CreateEventFields from "@/app/_components/CreateEventFields";
import Labels from "@/app/_components/atoms/labels";
import Alerts from "@/app/_components/molecules/alerts";
import useAuth from "@/hooks/useAuth";

const CreateEventAdminPage = () => {
  const { authorized, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  return (
    <>
      <div>
        <Labels.CampaignTitle title={"✨ Create New Event"} />
        <CreateEventFields event_uuid="" />
      </div>
    </>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
