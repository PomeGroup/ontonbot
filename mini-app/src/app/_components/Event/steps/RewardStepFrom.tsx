import { useCreateEventStore } from "@/zustand/createEventStore";
import { SbtOptionContent } from "../../organisms/events/SbtOptionContent";
import FormBlock from "../../atoms/cards/FormBlock";
import { Block, ListInput, ListItem, Preloader, Toggle } from "konsta/react";
import { cn } from "@/utils";
import { useEffect } from "react";
import { useGetEvent } from "@/hooks/events.hooks";
import Image from "next/image";

interface RewardFormProps {
  passwordDisabled: boolean;
  passwordValue: string;
  setPasswordValue: (_: string) => void;
  setPasswordDisabled: (_: boolean) => void;
  sbtOption: "custom" | "default";
  setSbtOption: (_: "custom" | "default") => void;
  clearImageError: () => void;
  clearVideoError: () => void;
}

export const RewardForm = ({
  passwordDisabled,
  passwordValue,
  setPasswordValue,
  setPasswordDisabled,
  sbtOption,
  setSbtOption,
  clearImageError,
  clearVideoError,
}: RewardFormProps) => {
  const eventDataRes = useGetEvent();
  const { editOptions, eventData, resetReward, errors, setEventData } = useCreateEventStore((state) => ({
    editOptions: state.edit,
    eventData: state.eventData,
    resetReward: state.resetReward,
    errors: state.rewardStepErrors,
    setEventData: state.setEventData,
  }));

  useEffect(() => {
    if (eventData?.eventLocationType === "in_person") {
      setEventData({ secret_phrase: "onton_default_placeholder" });
    } else {
      setEventData({ secret_phrase: "" });
    }
  }, [eventData?.eventLocationType]);

  return (
    <>
      {eventData?.eventLocationType !== "in_person" && (
        <FormBlock
          inset={false}
          title="Event password"
        >
          <ListInput
            placeholder="Enter your chosen password"
            name="secret_phrase"
            value={passwordValue}
            info={
              <div className="space-y-1">
                <p>Password is case-insensitive and must be at least 4 characters.</p>
                <p>
                  By setting a password for the event, you can prevent checking-in unexpectedly and receiving
                  a reward without attending the event.
                </p>
              </div>
            }
            inputClassName={cn({
              "text-cn-muted-foreground cursor-pointer": passwordDisabled,
            })}
            onClick={() => {
              if (passwordDisabled) {
                setPasswordDisabled(false);
                setPasswordValue("");
              }
            }}
            onChange={(e) => {
              setPasswordValue(e.target.value);
            }}
            error={errors?.secret_phrase?.[0]}
          />
        </FormBlock>
      )}

      {editOptions?.eventHash && (
        <Block className="space-y-4">
          {eventDataRes.isSuccess ? (
            <>
              <Image
                alt="ts-reward"
                width={100}
                height={100}
                src={eventDataRes.data?.tsRewardImage as string}
              />
              <video>
                <source src={eventDataRes.data?.tsRewardVideo as string} />
              </video>
            </>
          ) : (
            <Preloader />
          )}
        </Block>
      )}

      {!editOptions?.eventHash && (
        <FormBlock title="Choose SBT Option">
          <ListItem
            title="Custom Reward"
            after={
              <Toggle
                onChange={() => {
                  if (sbtOption === "custom") {
                    setSbtOption("default");
                  } else {
                    setSbtOption("custom");
                  }
                  resetReward();
                }}
                checked={sbtOption === "custom"}
              />
            }
          />

          <SbtOptionContent
            sbtOption={sbtOption}
            errors={errors || {}}
            clearImageError={clearImageError}
            clearVideoError={clearVideoError}
          />
        </FormBlock>
      )}
    </>
  );
};
