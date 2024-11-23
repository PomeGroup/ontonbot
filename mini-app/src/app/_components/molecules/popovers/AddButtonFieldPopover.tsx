"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ButtonDynamicField, ButtonDynamicFieldSchema, ButtonField, FieldElement, ZodErrors } from "@/types";
import { Dispatch, SetStateAction, useState } from "react";

const AddButtonFieldPopover: React.FC<{
  setFields: Dispatch<SetStateAction<FieldElement[]>>;
}> = ({ setFields }) => {
  const [newButtonField, setNewButtonField] = useState<ButtonDynamicField>({
    type: "button",
  } as ButtonDynamicField);
  const [open, setOpen] = useState(false);

  const [zodErrors, setZodErrors] = useState<ZodErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, property: keyof ButtonField) => {
    setNewButtonField({ ...newButtonField, [property]: e.target.value });
  };

  const addNewButtonField = () => {
    const result = ButtonDynamicFieldSchema.safeParse(newButtonField);

    let zodErrors = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        zodErrors = { ...zodErrors, [issue.path[0]]: issue.message };
      });

      setZodErrors(zodErrors);
      return;
    }

    setZodErrors({});

    setOpen(false);
    setFields((prevFields) => [...prevFields, newButtonField]);
    setNewButtonField({ type: "button" } as ButtonDynamicField);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="w-full"
        >
          Add Link
        </Button>
      </PopoverTrigger>
      <PopoverContent className="!border-cn-separator !bg-separatorwo !rounded-lg">
        <div className="grid gap-1">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="title">
                Title
                {zodErrors?.title && (
                  <div className="text-red-500 col-start-3 text-[12px]">{zodErrors.title}</div>
                )}
              </Label>
              <Input
                id="title"
                value={newButtonField.title}
                onChange={(e) => handleInputChange(e, "title")}
                placeholder="Title"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description">
                Description
                {zodErrors?.description && (
                  <div className="text-red-500 col-start-3 text-[12px]">{zodErrors.description}</div>
                )}
              </Label>
              <Input
                id="description"
                value={newButtonField.description}
                onChange={(e) => handleInputChange(e, "description")}
                placeholder="Description"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="url">
                URL
                {zodErrors?.url && (
                  <div className="text-red-500 col-start-3 text-[12px]">{zodErrors.url}</div>
                )}
              </Label>
              <Input
                id="url"
                value={newButtonField.url}
                onChange={(e) => handleInputChange(e, "url")}
                placeholder="URL"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="emoji">
                Emoji
                {zodErrors?.emoji && (
                  <div className="text-red-500 col-start-3 text-[12px]">{zodErrors.emoji}</div>
                )}
              </Label>
              <Input
                id="emoji"
                value={newButtonField.emoji}
                onChange={(e) => handleInputChange(e, "emoji")}
                placeholder="Emoji"
                className="col-span-2 h-8"
              />
            </div>
          </div>
          <Button
            onClick={addNewButtonField}
            variant="outline"
            className="mt-4"
          >
            Add Field
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddButtonFieldPopover;
