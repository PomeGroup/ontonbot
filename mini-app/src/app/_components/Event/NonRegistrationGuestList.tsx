import Tables from "@/app/_components/molecules/tables";
import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { RouterOutput } from "@/server";
import { useState } from "react";
import QrCodeButton from "@/app/_components/atoms/buttons/QrCodeButton";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import CheckInGuest from "@/app/_components/checkInGuest/CheckInGuest";
import { Block } from "konsta/react";

interface Props {
  event: RouterOutput["events"]["getEvent"];
  params: {
    hash: string;
  };
}

const NonRegistrationGuestList = (props: Props) => {
  useWithBackButton({
    whereTo: "/",
  });

  const [needRefresh, setNeedRefresh] = useState(false);
  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;
  const requestExportFileMutation = trpc.events.requestExportFile.useMutation();
  const handleVisitorsExport = async () => {
    await requestExportFileMutation.mutateAsync({
      event_uuid: props.params.hash,
    });
    hapticFeedback?.impactOccurred("medium");

    webApp?.close();
  };
  const guestCheckInParams = {
    hash: props.params.hash,
    setNeedRefresh,
    needRefresh,
  };

  return (
    <Block strong>
      {props.event?.event_uuid && (
        <QrCodeButton
          event_uuid={props.event.event_uuid}
          url={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${props.event.event_uuid}`}
          hub={props.event.society_hub?.name!}
        />
      )}

      <div className="mt-0 flex items-center space-x-2 px-2  ">
        <span className=" text-2xl font-extrabold tracking-tight dark:text-gray-300 mr-auto"> Guests List </span>
        {props.event && props.event.ticketToCheckIn === true && (
          <span>
            <CheckInGuest params={guestCheckInParams} />
          </span>
        )}
      </div>

      <Tables.Visitors
        event_uuid={props.params.hash}
        handleVisitorsExport={handleVisitorsExport}
        setNeedRefresh={setNeedRefresh}
        needRefresh={needRefresh}
      />
    </Block>
  );
};

export default NonRegistrationGuestList;
