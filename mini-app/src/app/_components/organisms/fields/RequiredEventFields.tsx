"use client";

import { TRequiredEventFields, ZodErrors } from "@/types";
import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import Card from "../../atoms/cards";
import Input from "../../atoms/inputs";
import Labels from "../../atoms/labels";
import Pickers from "../../molecules/pickers";

export type RequiredEventFieldsProps = {
  formData: TRequiredEventFields;
  setFormData: Dispatch<SetStateAction<TRequiredEventFields>>;
  zodErrors: ZodErrors;
};

const RequiredEventFields: FC<RequiredEventFieldsProps> = ({
  formData,
  setFormData,
  zodErrors,
}) => {
  const [timeZone, setTimeZone] = useState(formData?.timezone || "");

  useEffect(() => {
    const currentLocalTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(currentLocalTimezone);
    setFormData((prev) => {
      return { ...prev, timezone: currentLocalTimezone };
    });
  }, [timeZone]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    field: string
  ) => {
    setFormData((prev) => {
      return { ...prev, [field]: e.target.value };
    });
  };

  const handlePropertyChange = (
    value: string | number | object | boolean,
    field: string
  ) => {
    setFormData((prev) => {
      return { ...prev, [field]: value };
    });
  };

  return (
    <div>
      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Title</Labels.Label>
          <Labels.Label>
            {zodErrors?.title && (
              <div className="text-red-500 text-end">{zodErrors.title}</div>
            )}
          </Labels.Label>
        </div>

        <Input
          value={formData.title}
          onChange={(e) => handleChange(e, "title")}
        />
      </Card>
      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Subtitle</Labels.Label>
          <Labels.Label>
            {zodErrors?.subtitle && (
              <div className="text-red-500 text-end">{zodErrors.subtitle}</div>
            )}
          </Labels.Label>
        </div>

        <Input
          value={formData.subtitle}
          onChange={(e) => handleChange(e, "subtitle")}
        />
      </Card>
      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Description</Labels.Label>
          <Labels.Label>
            {zodErrors?.description && (
              <div className="text-red-500 text-end">
                {zodErrors.description}
              </div>
            )}
          </Labels.Label>
        </div>

        <textarea
          className="w-full h-32 rounded-lg border border-separator p-2"
          value={formData.description}
          onChange={(e) => handleChange(e, "description")}
        />
      </Card>

      <Pickers.TonHubPicker
        value={formData.society_hub}
        onValueChange={(e) => handlePropertyChange(e, "society_hub")}
        errors={zodErrors}
      />

      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Location</Labels.Label>
          <Labels.Label>
            {zodErrors?.location && (
              <div className="text-red-500 text-end">{zodErrors.location}</div>
            )}
          </Labels.Label>
        </div>

        <Input
          value={formData.location}
          onChange={(e) => handleChange(e, "location")}
        />
      </Card>

      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Image URL</Labels.Label>
          <Labels.Label>
            {zodErrors?.image_url && (
              <div className="text-red-500 text-end">{zodErrors.image_url}</div>
            )}
          </Labels.Label>
        </div>

        <Input
          value={formData.image_url}
          onChange={(e) => handleChange(e, "image_url")}
        />
      </Card>

      <Card className="flex flex-col items-start pt-1">
        <div className="flex justify-between w-full">
          <Labels.Label>Event Password</Labels.Label>
          <Labels.Label>
            {zodErrors?.secret_phrase && (
              <div className="text-red-500 text-end">
                {zodErrors.secret_phrase}
              </div>
            )}
          </Labels.Label>
        </div>

        <Input
          placeholder="Enter the Event Password"
          value={formData.secret_phrase}
          onChange={(e) => handleChange(e, "secret_phrase")}
          minLength={4}
          maxLength={20}
        />
      </Card>

      <Pickers.Datetimepicker
        title={"Start Date"}
        value={formData.start_date}
        setTimestamp={(num: number) => {
          handlePropertyChange(num, "start_date");
        }}
        errors={zodErrors}
      />

      <Pickers.Datetimepicker
        title={"End Date"}
        value={formData.end_date}
        setTimestamp={(num: number) => {
          handlePropertyChange(num, "end_date");
        }}
        errors={zodErrors}
      />
      <div className="mb-4">
        <p className="w-full flex gap-2 items-center">
          Timezone
          <span className="text-blue-500">
            {formData.timezone ? formData.timezone : "UTC"}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Event timezone is automatically set based on your location, and also
          it will be converted to other users based on their timezones.
        </p>
      </div>
    </div>
  );
};

export default RequiredEventFields;
