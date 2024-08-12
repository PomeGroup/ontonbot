import { EventDataSchemaAllOptional } from "@/types";
import { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type CreateEventStoreType = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  eventData?: z.infer<typeof EventDataSchemaAllOptional>;
  setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) => void;
  edit?: {
    eventHash?: string;
  };
  setEdit: (edit: { eventHash?: string }) => void;
};

export const useCreateEventStore = create(
  devtools<CreateEventStoreType>((set) => ({
    currentStep: 1,
    eventData: {
      dynamic_fields: [],
      owner: 0,
      type: 0,
    },
    setCurrentStep: (step: number) =>
      set((state) => ({ ...state, currentStep: step })),
    setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) =>
      set((state) => ({
        ...state,
        eventData: { ...state.eventData, ...data },
      })),

    setEdit: (edit: { eventHash?: string }) =>
      set((state) => ({ ...state, edit })),
  }))
);
