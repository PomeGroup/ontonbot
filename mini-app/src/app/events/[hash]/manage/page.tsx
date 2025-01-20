"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Page, Block, Card } from "konsta/react";
// svg icons
import guestListIcon from "./guest-list.svg";
import promotionCodeIcon from "./promotion-code.svg";
import ordersIcon from "./orders.svg";
import { useManageEventContext } from "./layout";
import EventCard from "@/app/_components/EventCard/EventCard";
import ActionCard from "@/components/ActionCard";
import { useSectionStore } from "@/zustand/useSectionStore";

export default function ManageIndexPage() {
  // 1) We get eventData from the layout's context:
  const { eventData } = useManageEventContext();
  const { setSection } = useSectionStore();
  const router = useRouter();
  if (!eventData || !eventData?.event_uuid) {
    return <div>Loading...</div>;
  }
  // Example stats for your ActionCard footers
  const ordersPaid = 1;
  const ordersPending = 1;
  const codesTotal = 46;
  const codesActive = 25;
  const codesUsed = 18;
  // const attendanceSent = 100;
  // const attendanceReceived = 73;
  const guestsRegistered = 100;
  const guestsApproved = 98;

  // The main “Manage” page
  return (
    <Page>
      {/* Show an EventCard with the event data */}
      <Block  className="mx-8 bg-white p-4 rounded-[10px]">
        <EventCard
          event={{
            eventUuid: eventData.event_uuid,
            title: eventData.title ?? "Untitled Event",
            startDate: eventData.start_date!!,
            endDate: eventData.end_date!!,
            location: eventData.location ?? "No Location",
            imageUrl: eventData.image_url ?? "/template-images/default.webp",
            subtitle: eventData.subtitle ?? "",
            organizerUserId: eventData.owner ?? 0,
          }}
          canEdit={true}
          onEditClick={() => {
            setSection("event_setup_form_general_step");
            router.push(`/events/${eventData.event_uuid}/manage/edit`);
          }}
          hasBorder={false}
        />
      </Block>

      {/* Action Cards for each sub-route */}
      <Block className="space-y-3 mt-4">

        {eventData.has_payment  && (
          <>
            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/orders`)}
              iconSrc={ordersIcon}
              title="Orders"
              subtitle="Event creation payments"
              footerTexts={[
                { count: ordersPaid, items: "Paid" },
                { count: ordersPending, items: "Pending" },
              ]}
            />

            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/promotion-code`)}
              iconSrc={promotionCodeIcon}
              title="Promotion Codes"
              subtitle="Generate and manage codes"
              footerTexts={[
                { count: codesTotal, items: "Codes" },
                { count: codesActive, items: "Active" },
                { count: codesUsed, items: "Used" },
              ]}
            />
          </>
        )}


        {/*{ eventData.participationType === "online" && (*/}
        {/*<ActionCard*/}
        {/*  onClick={() => router.push(`/events/${eventData.event_uuid}/manage/attendance`)}*/}
        {/*  iconSrc="/icons/attendance.png"*/}
        {/*  title="Get Attendance"*/}
        {/*  subtitle="Proof of attendance"*/}
        {/*  footerTexts={[*/}
        {/*    { count: attendanceSent, items: "Sent" },*/}
        {/*    { count: attendanceReceived, items: "Received" },*/}
        {/*  ]}*/}
        {/*/>*/}
        {/*)}*/}


        { eventData.has_registration && (
        <ActionCard
          onClick={() => router.push(`/events/${eventData.event_uuid}/manage/guest-list`)}
          iconSrc={guestListIcon}
          title="Guests list"
          subtitle="View and manage participants"
          footerTexts={[
            { count: guestsRegistered, items: "Registered" },
            { count: guestsApproved, items: "Approved" },
          ]}
        />
        )}
      </Block>
    </Page>
  );
}
