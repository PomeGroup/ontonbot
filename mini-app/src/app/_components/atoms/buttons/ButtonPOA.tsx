"use client";

import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { LoaderIcon } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";
import { EventTriggerType } from "@/db/enum";

const ButtonPOA = ({ event_uuid, poa_type }: { event_uuid: string; poa_type?: EventTriggerType }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  console.log("poa_type", poa_type);
  const POAType = poa_type || "simple";
  const hapticFeedback = WebApp?.HapticFeedback;
  const CreatePOAMutation = trpc.EventPOA.Create.useMutation();

  return (
    <KButton
      tonal
      rounded
      disabled={!initData || CreatePOAMutation.isLoading}
      onClick={async () => {
        if (!initData) return;
        await CreatePOAMutation.mutateAsync({
          event_uuid,
          poa_type: POAType,
        });

        hapticFeedback?.impactOccurred("medium");
      }}
      className="space-x-2"
    >
      <SiGoogleclassroom />
      <span>Get Attendance </span>
      {CreatePOAMutation.isLoading && <LoaderIcon className="h-5 animate-spin" />}
    </KButton>
  );
};

export default ButtonPOA;
