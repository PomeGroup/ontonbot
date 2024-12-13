"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";
import {EventTriggerType} from "@/db/enum";

const ButtonPOA = ({ event_uuid , poa_type }: { event_uuid: string;  poa_type?: EventTriggerType }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  console.log("poa_type", poa_type);
  const POAType = poa_type || 'simple';
  const hapticFeedback = WebApp?.HapticFeedback;
  const CreatePOAMutation = trpc.EventPOA.Create.useMutation();

  return (
    <Button
      className={cn(
        "w-full text-sm xs:text-md space-x-2 mb-4 mt-2",
        CreatePOAMutation.isLoading && Boolean(initData) && "opacity-50"
      )}
      variant={"secondary"}
      disabled={!initData || CreatePOAMutation.isLoading}
      onClick={async () => {
        if (!initData) return;
        await CreatePOAMutation.mutateAsync({
          event_uuid,
          poa_type: POAType,
        });

        hapticFeedback?.impactOccurred("medium");


      }}
    >
      <SiGoogleclassroom />
      <span>Get Attendance </span>
      {CreatePOAMutation.isLoading && <LoaderIcon className="h-5 animate-spin" />}
    </Button>
  );
};

export default ButtonPOA;
