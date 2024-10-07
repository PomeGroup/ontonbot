import Tables from "@/app/_components/molecules/tables";
import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { RouterOutput } from "@/server";
import { useState } from "react";
import QrCodeButton from "../../atoms/buttons/QrCodeButton";
import CheckInGuest from "../../checkInGuest/CheckInGuest";

interface Props {
  event: RouterOutput["events"]["getEvent"];
  params: {
    UUID: string;
  };
}

const GuestList = (props: Props) => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;
  const requestExportFileMutation = trpc.events.requestExportFile.useMutation();
  const handleVisitorsExport = () => {
    requestExportFileMutation.mutate({
      event_uuid: props.params.UUID,
      init_data: webApp?.initData || "",
    });
    hapticFeedback?.impactOccurred("medium");

    webApp?.close();
  };
  const guestCheckInParams = {
    UUID: props.params.UUID,
    setNeedRefresh,
    needRefresh,
  };

  return (
    <>
      {props.event?.event_uuid && (
        <QrCodeButton
          event_uuid={props.event.event_uuid}
          url={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${props.event.event_uuid}`}
          hub={props.event.society_hub.name!}
        />
      )}

      <div className="mt-0 flex items-center space-x-2 px-2  ">
        <span className=" text-2xl font-extrabold tracking-tight text-gray-300 mr-auto">
          {" "}
          Guests List{" "}
        </span>
        {props.event && props.event.ticketToCheckIn === true && (
          <span>
            <CheckInGuest params={guestCheckInParams} />
          </span>
        )}
      </div>

      <Tables.Visitors
        event_uuid={props.params.UUID}
        handleVisitorsExport={handleVisitorsExport}
        setNeedRefresh={setNeedRefresh}
        needRefresh={needRefresh}
      />
    </>
  );
};

export default GuestList;
