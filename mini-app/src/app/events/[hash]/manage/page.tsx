"use client";

import { Block, Page } from "konsta/react";
import { useParams, useRouter } from "next/navigation";
// svg icons
import coOrganizerIcon from "./co-organizers.svg";
import guestListIcon from "./guest-list.svg";
import ordersIcon from "./orders.svg";
import promotionCodeIcon from "./promotion-code.svg";

import CustomButton from "@/app/_components/Button/CustomButton";
import CheckUserInList from "@/app/_components/CheckUserInList";
import EventCard from "@/app/_components/EventCard/EventCard";
import ActionCard from "@/components/ActionCard";
import { ALLOWED_USER_TO_TEST } from "@/constants";
import { useUserStore } from "@/context/store/user.store";
import { useGetEvent } from "@/hooks/events.hooks";
import { canUserEditEvent, canUserPerformRole, CheckAdminOrOrganizer } from "@/lib/userRolesUtils";
import { useSectionStore } from "@/zustand/useSectionStore";

export default function ManageIndexPage() {
  // 1) We get eventData from the layout's context:
  const { hash } = useParams() as { hash?: string };
  const { data: eventData, isLoading, isError } = useGetEvent(hash);

  const { setSection } = useSectionStore();
  const router = useRouter();

  const { user } = useUserStore();

  if (isError) {
    return <div>something went wrong</div>;
  }
  if (!eventData || !eventData?.event_uuid || isLoading) {
    return null;
  }

  const adminCount = eventData.accessRoles.filter((item) => item.role === "admin").length + 1;
  const officerCount = eventData.accessRoles.filter((item) => item.role === "checkin_officer").length;

  const canEditEvent = canUserEditEvent({ user, owner: eventData?.owner, accessRoles: eventData?.accessRoles });

  const guestListAccess = canUserPerformRole({
    user,
    accessRoles: eventData?.accessRoles,
    allowedRoles: ["checkin_officer", "admin"],
  });

  const hasAdminOrOrganizerAccess = CheckAdminOrOrganizer(user?.role);
  // The main “Manage” page
  return (
    <Page>
      {/* Show an EventCard with the event data */}
      <div className="bg-white rounded-2lg mx-4 mt-4 pb-3">
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
            hasApproval: eventData.has_approval,
            hasPayment: eventData.has_payment,
            hasRegistration: eventData.has_registration,
          }}
          noClick
        />
        {canEditEvent && (
          <div className="mx-3 mt-3">
            <CustomButton
              onClick={() => {
                setSection("event_setup_form_general_step");
                router.push(`/events/${eventData.event_uuid}/manage/edit`);
              }}
              variant="outline"
              size="md"
            >
              Edit Event Info
            </CustomButton>
          </div>
        )}
      </div>

      {/* Action Cards for each sub-route */}
      <Block className="-mx-4 !my-0">
        {eventData.has_payment && canEditEvent && (
          <>
            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/orders`)}
              iconSrc={ordersIcon}
              title="Orders"
              subtitle="Event creation payments"
              footerTexts={[]}
            />
            <CheckUserInList
              userList={ALLOWED_USER_TO_TEST}
              currentUserId={user?.user_id}
            >
              <ActionCard
                onClick={() => router.push(`/events/${eventData.event_uuid}/manage/promotion-code`)}
                iconSrc={promotionCodeIcon}
                title="Promotion Codes"
                subtitle="Generate and manage codes"
                footerTexts={[]}
              />
            </CheckUserInList>
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

        {guestListAccess && (
          <ActionCard
            onClick={() => router.push(`/events/${eventData.event_uuid}/manage/guest-list`)}
            iconSrc={guestListIcon}
            title="Guests list"
            subtitle="View and manage participants"
            footerTexts={[]}
          />
        )}

        {hasAdminOrOrganizerAccess && (
          <ActionCard
            onClick={() => router.push(`/events/${eventData.event_uuid}/manage/co-organizers`)}
            iconSrc={coOrganizerIcon}
            title="Co-organizers"
            subtitle="Grant and remove access to check-in officers and admins"
            footerTexts={[
              {
                count: adminCount,
                items: "Admin" + (adminCount > 1 ? "s" : ""),
              },
              {
                count: officerCount,
                items: "Check-in officer" + (officerCount > 1 ? "s" : ""),
              },
            ]}
          />
        )}
      </Block>
    </Page>
  );
}
