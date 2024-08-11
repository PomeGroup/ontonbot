import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

export const ThirdStep = () => {
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.setEventData);
  return (
    <StepLayout title="Event's password">
      <Input
        placeholder="Enter your chosen password"
        onChange={(e) =>
          setEventData({
            ...eventData,
            secret_phrase: e.target.value,
          })
        }
      />

      <Alert>
        <Info />
        <AlertDescription>
          By setting a password for the event, you can prevent checking-in
          unexpectedly and receiving reward without attending the event.
        </AlertDescription>
      </Alert>

      <MainButton text="Create event" />
    </StepLayout>
  );
};
