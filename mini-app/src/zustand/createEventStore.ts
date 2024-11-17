import { GeneralFormErrors } from "@/app/_components/Event/steps/types";
import { EventDataSchemaAllOptional } from "@/types";
import { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type StoreEventData = z.infer<typeof EventDataSchemaAllOptional>;

export type CreateEventStoreType = {
  currentStep: number;
  setCurrentStep: (_step: number) => void;
  eventData?: StoreEventData;
  setEventData: (_data: z.infer<typeof EventDataSchemaAllOptional>) => void;
  edit?: {
    eventHash?: string;
  };
  setEdit: (_edit: { eventHash?: string }) => void;
  resetState: () => void;
  generalStepErrors?: GeneralFormErrors;
  clearImageErrors: () => void;
  setGeneralStepErrors: (_: GeneralFormErrors) => void;
  clearGeneralStepErrors: () => void;
};

export const useCreateEventStore = create(
  devtools<CreateEventStoreType>((set) => ({
    currentStep: 1,
    eventData: {
      dynamic_fields: [],
      owner: 0,
      type: 0,
    },
    clearImageErrors: () => {
      set((state) => ({
        ...state,
        generalStepErrors: { ...state.generalStepErrors, image_url: undefined },
      }));
    },
    setGeneralStepErrors: (errors: GeneralFormErrors) => {
      set((state) => ({
        ...state,
        generalStepErrors: { ...errors },
      }));
    },
    clearGeneralStepErrors: () => {
      set((state) => {
        return {
          ...state,
          generalStepErrors: {},
        };
      });
    },
    setCurrentStep: (step: number) =>
      set((state) => ({ ...state, currentStep: step })),
    setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) =>
      set((state) => {
        return { ...state, eventData: { ...state.eventData, ...data } };
      }),

    setEdit: (edit: { eventHash?: string }) =>
      set((state) => ({ ...state, edit })),

    resetState: () => {
      set(() => ({
        currentStep: 1,
        eventData: { dynamic_fields: [], type: 0, owner: 0 },
        edit: {},
      }));
    },
  }))
);
