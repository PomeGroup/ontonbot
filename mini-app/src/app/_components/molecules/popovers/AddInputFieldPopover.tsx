"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FieldElement,
  InputDynamicField,
  InputDynamicFieldSchema,
  InputField,
  ZodErrors,
} from "@/types";
import { Dispatch, SetStateAction, useState } from "react";

const AddInputFieldPopover: React.FC<{
  setFields: Dispatch<SetStateAction<FieldElement[]>>;
}> = ({ setFields }) => {
  const [newField, setNewField] = useState<InputDynamicField>({
    type: "input",
  } as InputDynamicField);
  const [open, setOpen] = useState(false);
  const [zodErrors, setZodErrors] = useState<ZodErrors>({});

  // InputDynamicFieldSchema

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    property: keyof InputField
  ) => {
    setNewField({ ...newField, [property]: e.target.value });
  };

  const addNewField = () => {
    const result = InputDynamicFieldSchema.safeParse(newField);

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
    setFields((prevFields) => [...prevFields, newField]);
    setNewField({
      type: "input",
    } as InputDynamicField); // Reset the form
  };

  return (
    <Popover
      open={open}
      onOpenChange={(e) => setOpen(e)}
    >
      <PopoverTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="w-full"
        >
          Add Input
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" !border-cn-separator !bg-separatorwo !rounded-lg">
        <div className="grid gap-1 p-">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="title">
                Title
                {zodErrors?.title && (
                  <div className="text-red-500 col-start-3 text-[12px]">
                    {zodErrors.title}
                  </div>
                )}
              </Label>
              <Input
                id="title"
                value={newField.title}
                onChange={(e) => handleInputChange(e, "title")}
                placeholder="Title"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description">
                Description
                {zodErrors?.description && (
                  <div className="text-red-500 col-start-3 text-[12px]">
                    {zodErrors.description}
                  </div>
                )}
              </Label>
              <Input
                id="description"
                value={newField.description}
                onChange={(e) => handleInputChange(e, "description")}
                placeholder="Description"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="placeholder">
                Placeholder
                {zodErrors?.placeholder && (
                  <div className="text-red-500 col-start-3 text-[12px]">
                    {zodErrors.placeholder}
                  </div>
                )}
              </Label>
              <Input
                id="placeholder"
                value={newField.placeholder}
                onChange={(e) => handleInputChange(e, "placeholder")}
                placeholder="Placeholder"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="emoji">
                Emoji
                {zodErrors?.emoji && (
                  <div className="text-red-500 col-start-3 text-[12px]">
                    {zodErrors.emoji}
                  </div>
                )}
              </Label>
              <Input
                id="emoji"
                value={newField.emoji}
                onChange={(e) => handleInputChange(e, "emoji")}
                placeholder="Emoji"
                className="col-span-2 h-8"
              />
            </div>
          </div>
          <Button
            onClick={addNewField}
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

export default AddInputFieldPopover;
