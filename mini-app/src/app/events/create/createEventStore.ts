import { EventDataSchemaAllOptional } from "@/types";
import { z } from "zod";
import { create } from "zustand";

type CreateEventStoreType = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  eventData?: z.infer<typeof EventDataSchemaAllOptional>;
  setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) => void;
};

export const useCreateEventStore = create<CreateEventStoreType>((set) => ({
  currentStep: 0,
  setCurrentStep: (step: number) => set({ currentStep: step }),
  setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) =>
    set({ eventData: data }),
}));
