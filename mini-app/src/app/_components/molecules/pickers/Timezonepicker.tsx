"use client";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { gmtTimeZones } from "@/constants";
import { FC } from "react";
import { ZodErrors } from "@/types";
import Card from "../../atoms/cards";
import Labels from "../../atoms/labels";

const Timezonepicker: FC<{
  value: string;
  onValueChange: (value: string) => void;
  errors: ZodErrors;
}> = ({ value, onValueChange, errors }) => {
  return (
    <Card className="flex flex-col items-start pt-1 w-full">
      <div className="flex justify-between w-full">
        <Labels.Label>Time Zone</Labels.Label>
        <Labels.Label>
          {errors?.timezone && (
            <div className="text-red-500 text-end">{errors.timezone}</div>
          )}
        </Labels.Label>
      </div>
      <Select
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="w-full dark:bg-separator">
          <SelectValue placeholder="Select Time Zone" />
        </SelectTrigger>
        <SelectContent
          ref={(ref) => {
            if (!ref) return;
            ref.ontouchstart = (e) => {
              e.preventDefault();
            };
          }}
          className="max-h-[250px] dark:bg-separatorwo"
        >
          <SelectGroup className="max-h-[250px]">
            {gmtTimeZones.map((zone, index) => (
              <SelectItem
                className="dark:hover:bg-separator"
                key={index}
                value={zone}
              >
                {zone}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Card>
  );
};

export default Timezonepicker;
