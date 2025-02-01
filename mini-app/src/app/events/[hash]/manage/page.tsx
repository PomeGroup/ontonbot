"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Page, Block, Button } from "konsta/react";
// svg icons
import guestListIcon from "./guest-list.svg";
// import promotionCodeIcon from "./promotion-code.svg";
import ordersIcon from "./orders.svg";
import coOrganizerIcon from './co-organizers.svg'

import EventCard from "@/app/_components/EventCard/EventCard";
import ActionCard from "@/components/ActionCard";
import { useSectionStore } from "@/zustand/useSectionStore";
import { useGetEvent } from "@/hooks/events.hooks";
import { useUserStore } from "@/context/store/user.store";
import hardcodedAcl from "./hardcodedAcl";
import {
  canUserEditEvent,
  canUserManageEvent,
  canUserPerformRole,
  CheckAdminOrOrganizer,

} from "@/lib/userRolesUtils";
const hardcodedAdminUsers = [
  47284045, // dacrime
  548648769, // radiophp
  185027333, // sid
  23932283, // Mfarimani
  68007062, // blackpred
  748891997, // samyar_kd
  438186721, // masious


]
export default function ManageIndexPage() {
  // 1) We get eventData from the layout's context:
  const { hash } = useParams() as { hash?: string };
  const { data: eventData, isLoading, isError } = useGetEvent(hash);

  const { setSection } = useSectionStore();
  const router = useRouter();

  const { user } = useUserStore()

  if (isError) {
    return <div>something went wrong</div>
  }
  if (!eventData || !eventData?.event_uuid || isLoading) {
    return null;
  }



  const adminCount = eventData.accessRoles.filter(item => item.role === 'admin').length + 1
  const officerCount = eventData.accessRoles.filter(item => item.role === 'checkin_officer').length

  const canEditEvent = canUserEditEvent({user,owner: eventData?.owner,accessRoles: eventData?.accessRoles}) ;

  if(user) {
    console.log( "canEditEvent", canEditEvent)
    console.log( "accessRolesArray some ",eventData?.accessRoles.some((ar:{ user_id: number; role: string } ) => ar.user_id === user.user_id  && ar.role === 'admin') )
  }
  const guestListAccess = canUserPerformRole({
       user,
      accessRoles:  eventData?.accessRoles,
      allowedRoles: ['checkin_officer', 'admin']
    }
    );

  const hasAdminOrOrganizerAccess = CheckAdminOrOrganizer(user?.role) ;
  // The main “Manage” page
  return (
    <Page>
      {/* Show an EventCard with the event data */}
      <Block className="bg-white p-4 rounded-[10px] mx-4 !mb-0">
        <EventCard
          event={{
            eventUuid: eventData.event_uuid,
            title: eventData.title ?? "Untitled Event",
            startDate: eventData.start_date!!,
            endDate: eventData.end_date!!,
            participationType: eventData.participationType ?? "",
            imageUrl: eventData.image_url ?? "/template-images/default.webp",
            subtitle: eventData.subtitle ?? "",
            organizerUserId: eventData.owner ?? 0,
            organizerChannelName: eventData?.organizer?.org_channel_name ?? "",
          }}
        >
          { canEditEvent && (
          <div className="mt-3 -mb-2">
            <Button
              className="px-3 rounded-[6px] py-4"
              outline={true}
              onClick={() => {
                setSection("event_setup_form_general_step");
                router.push(`/events/${eventData.event_uuid}/manage/edit`);
              }}
            >
              Edit Event Info
            </Button>
          </div>
          )}
        </EventCard>
      </Block>

      {/* Action Cards for each sub-route */}
      <Block className="-mx-4 my-3">
        {eventData.has_payment && canEditEvent && (
          <>
            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/orders`)}
              iconSrc={ordersIcon}
              title="Orders"
              subtitle="Event creation payments"
              footerTexts={[]}
              className='!m-0'
            />

            {/*<ActionCard*/}
            {/*  onClick={() => router.push(`/events/${eventData.event_uuid}/manage/promotion-code`)}*/}
            {/*  iconSrc={promotionCodeIcon}*/}
            {/*  title="Promotion Codes"*/}
            {/*  subtitle="Generate and manage codes"*/}
            {/*  footerTexts={[*/}
            {/*    { count: codesTotal, items: "Codes" },*/}
            {/*    { count: codesActive, items: "Active" },*/}
            {/*    { count: codesUsed, items: "Used" },*/}
            {/*  ]}*/}
            {/*/>*/}
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

        { guestListAccess && (
        <ActionCard
          onClick={() => router.push(`/events/${eventData.event_uuid}/manage/guest-list`)}
          iconSrc={guestListIcon}
          title="Guests list"
          subtitle="View and manage participants"
          footerTexts={[]}
        />
        )}

        {hasAdminOrOrganizerAccess && hardcodedAdminUsers.includes(user?.user_id ?? 0) &&
          (
            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/co-organizers`)}
              iconSrc={coOrganizerIcon}
              title="Co-organizers"
              subtitle="Grant and remove access to check-in officers and admins"
              footerTexts={[{
                count: adminCount,
                items: 'Admin' + (adminCount > 1 ? 's' : '')
              }, {
                count: officerCount,
                items: 'Check-in officer' + (officerCount > 1 ? 's' : '')
              }]}
            />
          )}
      </Block>
    </Page>
  );
}
