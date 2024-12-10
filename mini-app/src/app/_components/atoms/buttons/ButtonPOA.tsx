"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";

const ButtonPOA = ({ event_uuid }: { event_uuid: string; }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
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
