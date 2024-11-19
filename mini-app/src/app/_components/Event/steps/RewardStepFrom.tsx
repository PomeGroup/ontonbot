import { useCreateEventStore } from "@/zustand/createEventStore";
import { SbtOptionContent } from "../../organisms/events/SbtOptionContent";
import FormBlock from "../../atoms/cards/FormBlock";
import { ListInput, ListItem, Toggle } from "konsta/react";

interface RewardFormProps {
  passwordDisabled: boolean;
  passwordValue: string;
  setPasswordValue: (_: string) => void;
  sbtOption: "custom" | "default";
  setSbtOption: (_: "custom" | "default") => void;
  clearImageError: () => void;
  clearVideoError: () => void;
}

export const RewardForm = ({
  passwordDisabled,
  passwordValue,
  setPasswordValue,
  sbtOption,
  setSbtOption,
  clearImageError,
  clearVideoError,
}: RewardFormProps) => {
  const editOptions = useCreateEventStore((state) => state.edit);
  const resetReward = useCreateEventStore((state) => state.resetReward);
  const errors = useCreateEventStore((state) => state.rewardStepErrors);

  return (
    <>
      <FormBlock title="Event password">
        <ListInput
          placeholder="Enter your chosen password"
          name="secret_phrase"
          value={passwordValue}
          info={
            <div className="space-y-1">
              <p>
                Password is case-insensitive and must be at least 4 characters.
              </p>
              <p>
                By setting a password for the event, you can prevent checking-in
                unexpectedly and receiving a reward without attending the event.
              </p>
            </div>
          }
          disabled={passwordDisabled}
          onChange={(e) => setPasswordValue(e.target.value)}
          error={errors?.secret_phrase?.[0]}
        />
      </FormBlock>

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
