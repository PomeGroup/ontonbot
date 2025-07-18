"use client";

import { useParams, useRouter } from "next/navigation";
// svg icons
import coOrganizerIcon from "./co-organizers.svg";
import guestListIcon from "./guest-list.svg";
import promotionCodeIcon from "./promotion-code.svg";

import CustomButton from "@/app/_components/Button/CustomButton";
import ScanRegistrantQRCode from "@/app/_components/Event/ScanRegistrantQRCode";
import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import ActionCard from "@/components/ActionCard";
import Divider from "@/components/Divider";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/context/store/user.store";
import { useGetEvent } from "@/hooks/events.hooks";
import useWebApp from "@/hooks/useWebApp";
import { canUserEditEvent, canUserPerformRole, CheckAdminOrOrganizer } from "@/lib/userRolesUtils";
import { wait } from "@/lib/utils";
import { useSectionStore } from "@/zustand/useSectionStore";
import { EllipsisVertical, Pen, QrCode, ScanLine } from "lucide-react";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";

export default function ManageIndexPage() {
  const webApp = useWebApp();
  // 1) We get eventData from the layout's context:
  const { hash } = useParams() as { hash?: string };
  const { data: eventData, isLoading, isError } = useGetEvent(hash);

  const { setSection } = useSectionStore();
  const router = useRouter();

  const { user } = useUserStore();
  const requestSendQRCode = trpc.telegramInteractions.requestSendQRCode.useMutation();

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
    <div>
      {/* Show an EventCard with the event data */}
      <div className="bg-white rounded-2lg mx-4 my-4 pb-3">
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
            paymentType: eventData.payment_type ?? "",
          }}
          afterTitle={
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVertical className="inline text-primary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-4">
                <DropdownMenuItem>
                  <QrCode />
                  Get QR Code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {eventData.participationType === "in_person" && (
                  <ScanRegistrantQRCode>
                    <DropdownMenuItem>
                      <ScanLine />
                      Scan QR Code
                    </DropdownMenuItem>
                  </ScanRegistrantQRCode>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
        {canEditEvent && (
          <div className="flex flex-col gap-4 px-4 mt-3">
            <div className="grid xs:grid-cols-2 gap-3">
              {eventData.participationType === "online" ? (
                <CustomButton
                  disabled={Boolean(eventData.hidden) || Boolean(!eventData.enabled)}
                  onClick={async () => {
                    if (eventData.event_uuid) {
                      requestSendQRCode.mutateAsync({
                        url: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventData.event_uuid}`,
                        hub: eventData.society_hub?.name || undefined,
                        event_uuid: eventData.event_uuid,
                      });
                      webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`);
                      webApp?.HapticFeedback?.impactOccurred("medium");
                      await wait(200);
                      webApp?.close();
                    }
                  }}
                  variant="outline"
                  icon={<QrCode />}
                >
                  Get QR Code
                </CustomButton>
              ) : (
                <ScanRegistrantQRCode>
                  <CustomButton
                    variant="outline"
                    icon={<ScanLine />}
                  >
                    Scan QR Code
                  </CustomButton>
                </ScanRegistrantQRCode>
              )}
              <CustomButton
                onClick={() => {
                  setSection("event_setup_form_general_step");
                  router.push(`/events/${eventData.event_uuid}/manage/edit`);
                }}
                variant="outline"
                icon={<Pen />}
              >
                Edit Event Info
              </CustomButton>
            </div>
            <Divider />
            {/* not published state */}
            {eventData.hidden && (
              <Typography
                variant="subheadline2"
                weight="normal"
              >
                Event isn't published yet. <span className="font-medium">Set up the tickets</span> and{" "}
                <span className="font-medium">settle the bills</span> so guests can join!
              </Typography>
            )}
            <div className="flex gap-2 ">
              {eventData.has_payment && (
                <>
                  {/* Tickets */}
                  <Link
                    href={`/events/${eventData.event_uuid}/manage/tickets`}
                    className="flex-1"
                  >
                    <Button className="w-full">
                      Tickets
                      <HiChevronRight className="text-2xl text-primary ms-auto" />
                    </Button>
                  </Link>
                  {/* Billing */}
                  <Link
                    className="flex-1"
                    href={`/events/${eventData.event_uuid}/manage/orders`}
                  >
                    <Button className="w-full">
                      Billing
                      <HiChevronRight className="text-2xl text-primary ms-auto" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Cards for each sub-route */}
      <div className="px-4 !my-0 flex flex-col gap-4">
        {eventData.has_payment && canEditEvent && (
          <>
            <ActionCard
              onClick={() => router.push(`/events/${eventData.event_uuid}/manage/promotion-code`)}
              iconSrc={promotionCodeIcon}
              title="Promotion Codes"
              subtitle="Generate and manage codes"
              footerTexts={[]}
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
      </div>
    </div>
  );
}
