"use client";

import React, { useEffect, useState } from "react";
import { Page, Navbar, Block } from "konsta/react";

import useWebApp from "@/hooks/useWebApp";
import { trpc } from "@/app/_trpc/client";
import { Download } from "lucide-react";
import promotionCodeNoResult from "./promotion-code-no-result.svg";
import NavigationButtons from "@/components/NavigationButtons";
import ActionCardWithMenu from "./ActionCardWithMenu";
import CreatePromotionForm from "./CreatePromotionForm";
import EditPromotionDatesForm from "./EditPromotionDatesForm";
import { useDownloadCSV } from "@/app/_components/Event/PromotionCode/useDownloadCSV";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useGetEvent } from "@/hooks/events.hooks";



// The shape of a coupon definition from your server
// If your start/end date come as strings, convert them or adjust the type
interface Definition {
  id: number;
  count: number;
  value: number;
  used: number;
  start_date: Date; // or string => Date if needed
  end_date: Date;   // or string => Date if needed
  cpd_status: "active" | "inactive" | "expired";
}

export default function PromotionCode() {
  // 1) Hide Telegram back button on unmount
  const { hash } = useParams() as { hash?: string };
  const {data:eventData ,isLoading : eventDataLoading ,isError :eventDataError } = useGetEvent(hash);

  const webApp = useWebApp();
  useEffect(() => {
    return () => {
      webApp?.BackButton.hide();
    };
  }, [webApp]);

  // 2) Local states
  const [showCreateForm, setShowCreateForm] = useState(false);
  // track the definition we want to edit (dates)
  const [editingDef, setEditingDef] = useState<Definition | null>(null);

  // 3) CSV logic
  const { isCSVLoading, handleDownloadCSV } = useDownloadCSV();
  if(eventDataError) {
    return <div>something went wrong</div>
  }
  if(!eventData?.event_uuid || eventDataLoading ) {
    return <div>Loading...</div>;
  }
  const eventUuid = eventData.event_uuid;

  // 4) tRPC query: get coupon definitions
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.coupon.getCouponDefinitions.useQuery(
    { event_uuid: eventUuid },
    { enabled: Boolean(eventUuid) }
  );


  // 5) Status update (activate/deactivate) logic
  //    We'll show an item in the 3-dot menu that calls this
  const updateStatusMutation = trpc.coupon.updateCouponDefinitionStatus.useMutation({
    onSuccess: () => {
      // Refresh the data
      refetch();
    },
  });

  // 6) Handlers for toggling forms
  const handleCreatePromotion = () => {
    console.log("Create Promotion button clicked!");
    setShowCreateForm(true);
  };
  const handleFormDone = () => {
    setShowCreateForm(false);
    refetch(); // refresh definitions after creation
  };



  // 7) If showCreateForm => show <CreatePromotionForm />
  if (showCreateForm) {
    return (
      <CreatePromotionForm
        eventUuid={eventUuid}
        onDone={handleFormDone}
      />
    );
  }

  // 8) If editingDef => show <EditPromotionDatesForm />
  if (editingDef) {
    return (
      <EditPromotionDatesForm
        id={editingDef.id}
        eventUuid={eventUuid}
        initialCount={editingDef.count}
        initialValue={editingDef.value}
        initialStartDate={editingDef.start_date}
        initialEndDate={editingDef.end_date}
        onDone={() => {
          setEditingDef(null);
          refetch();
        }}
      />
    );
  }

  // 9) Loading / error / empty states
  if (isLoading) {
    return (
      <Page>
        <div className="px-4">
          <h1 className="text-lg font-bold">Create Your Codes</h1>
        </div>
        <Block className="text-center mt-4">
          Loading promotion codes...
        </Block>
      </Page>
    );
  }
  if (isError) {
    return (
      <Page>
        <div className="px-4">
          <h1 className="text-lg font-bold">Create Your Codes</h1>
        </div>
        <Block className="text-center mt-4 text-red-600">
          Failed to load codes: {error.message}
        </Block>
      </Page>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Page>
        <div className="px-4">
          <h1 className="text-lg font-bold">Create Your Codes</h1>
        </div>
        <Block className="flex flex-col items-center justify-center mt-8">
          <div className="mb-4 text-blue-500 text-6xl">
            <Image
              src={promotionCodeNoResult}
              width={48}
              height={48}
              alt=""
            />
          </div>
          <p className="font-bold text-lg">
            No discount code generated!
          </p>
          <p className="text-gray-500 text-sm mt-2 text-center max-w-[300px]">
            You can generate one-time discount codes and share them with
            your audience so they can benefit from discounts when purchasing
            this event’s tickets.
          </p>
        </Block>

        <NavigationButtons
          actions={[
            {
              label: "Create Promotion",
              onClick: handleCreatePromotion,
            },
          ]}
        />
      </Page>
    );
  }

  // 10) Otherwise => render the list with ActionCardWithMenu
  return (
    <Page>
      <Navbar title="Promotion Codes" />

      <Block className="space-y-2">
        {data.map((def) => {
          // Convert string => Date if needed
          // e.g. def.start_date = new Date(def.start_date)
          // e.g. def.end_date = new Date(def.end_date)

          // We'll build footers
          const footerTexts = [
            { count: def.count, items: "codes" },
            { count: def.used, items: "used" },
          ];

          // Build dynamic "Activate/Deactivate" item based on cpd_status
          let statusMenuItem = null;
          if (def.cpd_status === "expired") {
            // skip or show a disabled item
          } else if (def.cpd_status === "active") {
            statusMenuItem = {
              label: updateStatusMutation.isLoading ? "Deactivating..." : "Deactivate",
              disabled: updateStatusMutation.isLoading,
              onClick: () => {
                updateStatusMutation.mutate({
                  id: def.id,
                  event_uuid: eventUuid,
                  status: "inactive",
                });
              },
            };
          } else if (def.cpd_status === "inactive") {
            statusMenuItem = {
              label: updateStatusMutation.isLoading ? "Activating..." : "Activate",
              disabled: updateStatusMutation.isLoading,
              onClick: () => {
                updateStatusMutation.mutate({
                  id: def.id,
                  event_uuid: eventUuid,
                  status: "active",
                });
              },
            };
          }

          // Now build the 3-dot menu
          const menuItems = [
            {
              label: isCSVLoading ? "Loading CSV file..." : "Get list and statistics",
              icon: <Download className="w-4 h-4" />,
              disabled: isCSVLoading,
              onClick: async () => {
                if (!isCSVLoading) {
                  await handleDownloadCSV(def.id, eventUuid);
                }
              },
            },
            {
              label: "Edit Dates",
              onClick: () => {
                setEditingDef({
                  ...def,
                  start_date: new Date(def.start_date),
                  end_date: new Date(def.end_date),
                });
              },
            },
            // Insert the status item if not null
            ...(statusMenuItem ? [statusMenuItem] : []),

            {
              label: "Delete",
              color: "text-red-500",
              onClick: () => {
                console.log("Delete clicked for definition", def.id);
                // e.g. call a mutation to delete
              },
            },
          ];

          return (
            <ActionCardWithMenu
              key={def.id}
              iconSrc="/icons/ticket.png"
              title={`${def.count} codes`}
              subtitle={`%${def.value} discount - ${def.used} used`}
              footerTexts={footerTexts}
              menuItems={menuItems}
              onCardClick={() => {
                console.log("Card clicked, id =", def.id);
              }}
            />
          );
        })}
      </Block>
      {eventData.isNotEnded && (
        <NavigationButtons
          actions={[
            {
              label: "Create Promotion",
              onClick: handleCreatePromotion,
            },
          ]}
        />
      )}
    </Page>
  );
}
