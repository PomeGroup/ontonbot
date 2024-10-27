import React, { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StepLayout } from "./stepLayout";
import { useCreateEventStore } from "@/zustand/createEventStore";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";

export const AgendaStep = () => {
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const [agenda, setAgenda] = useState(
      eventData?.agenda || [{ header: "", items: [{ time: "", title: "", description: "" }] }]
  );

  // Convert eventData.start_date to 'HH:MM' format if start_date exists
  const getDefaultTime = () => {
    if (!eventData?.start_date) return "";
    const date = new Date(eventData.start_date * 1000); // assuming start_date is a Unix timestamp
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleAddHeader = () => {
    setAgenda([...agenda, { header: "", items: [{ time: getDefaultTime(), title: "", description: "" }] }]);
  };

  const handleRemoveHeader = (index: number) => {
    const updatedAgenda = agenda.filter((_, i) => i !== index);
    setAgenda(updatedAgenda);
  };

  const handleAddItem = (headerIndex: number) => {
    const updatedAgenda = agenda.map((header, i) =>
        i === headerIndex
            ? { ...header, items: [...header.items, { time: getDefaultTime(), title: "", description: "" }] }
            : header
    );
    setAgenda(updatedAgenda);
  };

  const handleRemoveItem = (headerIndex: number, itemIndex: number) => {
    const updatedAgenda = agenda.map((header, i) =>
        i === headerIndex
            ? { ...header, items: header.items.filter((_, j) => j !== itemIndex) }
            : header
    );
    setAgenda(updatedAgenda);
  };

  const handleInputChange = (
      headerIndex: number,
      itemIndex: number | null,
      field: "header" | "time" | "title" | "description",
      value: string
  ) => {
    const updatedAgenda = agenda.map((header, i) => {
      if (i === headerIndex) {
        if (field === "header") {
          return { ...header, header: value };
        } else if (itemIndex !== null) {
          const updatedItems = header.items.map((item, j) =>
              j === itemIndex ? { ...item, [field]: value } : item
          );
          return { ...header, items: updatedItems };
        }
      }
      return header;
    });
    setAgenda(updatedAgenda);
  };

  const handleNextStep = () => {
    setEventData({ ...eventData, agenda });
    setCurrentStep(5); // Go to the next step or submit if it's the final step
  };

  return (
      <StepLayout>
        <div className="space-y-6">
          {agenda.map((header, headerIndex) => (
              <div key={headerIndex} className="border-b pb-4 mb-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                      placeholder="Header"
                      value={header.header}
                      onChange={(e) =>
                          handleInputChange(headerIndex, null, "header", e.target.value)
                      }
                  />
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveHeader(headerIndex)}
                  >
                    <FiTrash2 className="mr-2" /> Remove Header
                  </Button>
                </div>

                {header.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-[120px_1fr_auto] gap-2 items-start">
                      {/* Time Input with default value and fixed width */}
                      <Input
                          type="time"
                          placeholder="Time"
                          value={item.time || getDefaultTime()}
                          onChange={(e) =>
                              handleInputChange(headerIndex, itemIndex, "time", e.target.value)
                          }
                          className="w-[120px]"
                      />
                      {/* Title Input - now takes up remaining space */}
                      <Input
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) =>
                              handleInputChange(headerIndex, itemIndex, "title", e.target.value)
                          }
                      />
                      {/* Delete Button spans both rows */}
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(headerIndex, itemIndex)}
                          className="row-span-2 h-[110px] flex items-center justify-center"
                      >
                        <FiTrash2 />
                      </Button>
                      {/* Description Textarea, spans full width in second row */}
                      <Textarea
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) =>
                              handleInputChange(headerIndex, itemIndex, "description", e.target.value)
                          }
                          className="resize-none overflow-hidden min-h-[56px] col-span-2"
                          rows={2}
                          style={{ height: "auto" }}
                      />
                    </div>
                ))}

                <Button variant="outline" size="sm" onClick={() => handleAddItem(headerIndex)} className="mt-4">
                  <FiPlus className="mr-2" /> Add Item
                </Button>
              </div>
          ))}

          <Button variant="outline" onClick={handleAddHeader} className="mb-6">
            <FiPlus className="mr-2" /> Add Header
          </Button>
        </div>

        <MainButton text="Next Step" onClick={handleNextStep} />
      </StepLayout>
  );
};