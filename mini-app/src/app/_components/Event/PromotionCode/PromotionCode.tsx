"use client";

import React, { useEffect, useState } from "react";
import { Page, Navbar, Block } from "konsta/react";
import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import NavigationButtons from "@/components/NavigationButtons";
import CreatePromotionForm from "./CreatePromotionForm";
import { Download } from "lucide-react";
// 1) Import your custom ActionCardWithMenu
import ActionCardWithMenu from "./ActionCardWithMenu";
import { useDownloadCSV } from "@/app/_components/Event/PromotionCode/useDownloadCSV"; // adjust path

interface PromotionCodeProps {
  eventUuid: string;
}

export default function PromotionCode({ eventUuid }: PromotionCodeProps) {
  const webApp = useWebApp();

  // a) Hide Telegram back button on unmount
  useEffect(() => {
    return () => {
      webApp?.BackButton.hide();
    };
  }, [webApp]);

  // b) local states
  const [showCreateForm, setShowCreateForm] = useState(false);

  // c) tRPC for coupon definitions
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

  // d) a separate tRPC mutation for updating the coupon status
  //    We'll use it to "Activate" or "Deactivate" a coupon
  const updateStatusMutation = trpc.coupon.updateCouponDefinitionStatus.useMutation({
    onSuccess: () => {
      // once status is updated, refresh the list
      refetch();
    },
  });

  // e) for CSV downloading
  const { isCSVLoading, handleDownloadCSV } = useDownloadCSV();

  // f) show/hide the create form
  const handleCreatePromotion = () => {
    setShowCreateForm(true);
  };
  const handleFormDone = () => {
    setShowCreateForm(false);
    refetch(); // refresh definitions after creation
  };

  // If showing creation form
  if (showCreateForm) {
    return (
      <CreatePromotionForm
        eventUuid={eventUuid}
        onDone={handleFormDone}
      />
    );
  }

  // Loading / Error / Empty
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
          <div className="mb-4 text-blue-500 text-6xl">🚫</div>
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

  // 2) Render existing definitions as ActionCardWithMenu
  return (
    <Page>
      <Navbar title="Promotion Codes" />

      <Block className="space-y-2">
        {data.map((def) => {
          const iconSrc = "/icons/ticket.png"; // or any icon for the card
          // footers for bottom text
          const footerTexts = [
            { count: def.count, items: "codes" },
            { count: def.used, items: "used" },
          ];

          // Build dynamic "Activate" or "Deactivate" item
          let statusMenuItem = null;
          if (def.cpd_status === "expired") {
            // if expired, maybe no item or show a disabled item
          } else if (def.cpd_status === "active") {
            statusMenuItem = {
              label: updateStatusMutation.isLoading
                ? "Deactivating..."
                : "Deactivate",
              disabled: updateStatusMutation.isLoading,
              onClick: () => {
                updateStatusMutation.mutate({
                  id: def.id,
                  event_uuid: eventUuid,
                  status: "inactive", // we want to deactivate
                });
              },
            };
          } else if (def.cpd_status === "inactive") {
            statusMenuItem = {
              label: updateStatusMutation.isLoading
                ? "Activating..."
                : "Activate",
              disabled: updateStatusMutation.isLoading,
              onClick: () => {
                updateStatusMutation.mutate({
                  id: def.id,
                  event_uuid: eventUuid,
                  status: "active", // we want to activate
                });
              },
            };
          }

          // Build the rest of the 3-dot menu
          const menuItems = [
            {
              label: isCSVLoading ? "Loading CSV file..." : "Get list and statistics",
              icon: <Download className="w-4 h-4" />,
              disabled: isCSVLoading,
              onClick: async () => {
                if (!isCSVLoading) {
                  // pass def.id as coupon_definition_id
                  await handleDownloadCSV(def.id, eventUuid);
                }
              },
            },
            {
              label: "Edit",
              onClick: () => {
                console.log("Edit clicked for definition", def.id);
              },
            },
            // if we do have a "Activate"/"Deactivate" item, push it here
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
              iconSrc={iconSrc}
              title={`${def.count} codes`}
              subtitle={`%${def.value} discount - ${def.used} used`}
              footerTexts={footerTexts}
              menuItems={menuItems}
              onCardClick={() => {
                // entire card click
                console.log("Card clicked, id =", def.id);
              }}
            />
          );
        })}
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
