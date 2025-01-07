import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { Block, Button, Checkbox, ListInput, ListItem, Toolbar } from "konsta/react";
import TonHubPicker from "../../molecules/pickers/TonHubpicker";
import { ImageUpload } from "./ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useGetHubs } from "@/hooks/events.hooks";
import { KSheet } from "@/components/ui/drawer";

interface Props {
  termsChecked: boolean;
  setTermsChecked: (_checked: boolean) => void;
  showTermsError: boolean;
}

function BasicEventInputs(props: Props) {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore((state) => state.clearImageErrors);
  const hubsResponse = useGetHubs();

  return (
    <ListLayout
      title="Basic"
      isLoading={hubsResponse.isLoading}
    >
      <ListInput
        outline
        placeholder="Event Title"
        name="title"
        label="Event Title"
        defaultValue={eventData?.title}
        error={errors?.title?.join(". ")}
      />
      <ListInput
        outline
        placeholder="Subtitle"
        name="subtitle"
        label="Subtitle"
        defaultValue={eventData?.subtitle}
        error={errors?.subtitle?.join(". ")}
      />
      <TonHubPicker
        onValueChange={(data) => {
          if (data) {
            setEventData({ society_hub: data });
          }
        }}
        value={eventData?.society_hub}
        errors={errors?.hub}
      />
      <ListInput
        type="textarea"
        outline
        placeholder="Description"
        label="Description"
        name="description"
        inputClassName="min-h-20"
        error={errors?.description?.join(". ")}
        defaultValue={eventData?.description}
      />
      <TermsCheckbox {...props} />
      <ImageUpload
        isError={Boolean(errors?.image_url)}
        clearError={clearImageError}
      />
    </ListLayout>
  );
}

export default BasicEventInputs;

function TermsCheckbox({ termsChecked, setTermsChecked, showTermsError }: Props) {
  return (
    <>
      <KSheet
        trigger={(open, setOpen) => (
          <ListItem
            className="mr-4"
            label
            titleWrapClassName="text-sm font-bold"
            title="I Agree to the terms & conditions"
            media={
              <Checkbox
                name="terms-and-conditions"
                checked={termsChecked}
                onChange={(e) => {
                  const { checked } = e.target;
                  if (!checked) {
                    setTermsChecked(false);
                    return;
                  }
                  setOpen(true);
                }}
              />
            }
            {...(showTermsError && { subtitle: <div className="text-xs text-red-500">Please agree to continue</div> })}
          />
        )}
      >
        {(open, setOpen) => (
          <>
            <Toolbar top>
              <div className="text-center flex-1 font-bold">Terms And Conditions</div>
            </Toolbar>
            <Block>
              <ul>
                <li>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Harum ad excepturi nesciunt nobis aliquam.
                  Quibusdam ducimus neque necessitatibus, molestias cupiditate velit nihil alias incidunt, excepturi
                  voluptatem dolore itaque sapiente dolores!
                </li>
                <li>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Harum ad excepturi nesciunt nobis aliquam.
                  Quibusdam ducimus neque necessitatibus, molestias cupiditate velit nihil alias incidunt, excepturi
                  voluptatem dolore itaque sapiente dolores!
                </li>
                <li>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Harum ad excepturi nesciunt nobis aliquam.
                  Quibusdam ducimus neque necessitatibus, molestias cupiditate velit nihil alias incidunt, excepturi
                  voluptatem dolore itaque sapiente dolores!
                </li>
                <li>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Harum ad excepturi nesciunt nobis aliquam.
                  Quibusdam ducimus neque necessitatibus, molestias cupiditate velit nihil alias incidunt, excepturi
                  voluptatem dolore itaque sapiente dolores!
                </li>
              </ul>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setTermsChecked(true);
                    setOpen(false);
                  }}
                >
                  agreed
                </Button>
              </div>
            </Block>
          </>
        )}
      </KSheet>
    </>
  );
}
