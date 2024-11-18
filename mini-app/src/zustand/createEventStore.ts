import {
  GeneralFormErrors,
  TimePlaceFormErorrs,
} from "@/app/_components/Event/steps/types";
import { EventDataSchemaAllOptional } from "@/types";
import { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type StoreEventData = z.infer<typeof EventDataSchemaAllOptional> & {
  hasEnded: boolean;
};

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
  timeplaceStepErrors?: TimePlaceFormErorrs;
  clearImageErrors: () => void;
  setGeneralStepErrors: (_: GeneralFormErrors) => void;
  setTimePlaceStepErrors: (_: TimePlaceFormErorrs) => void;
  clearGeneralStepErrors: () => void;
  clearTimePlaceStepErrors: () => void;
};

export const useCreateEventStore = create(
  devtools<CreateEventStoreType>((set) => ({
    currentStep: 1,
    eventData: {
      dynamic_fields: [],
      owner: 0,
      type: 0,
      hasEnded: true,
    },
    clearImageErrors: () => {
      set((state) => ({
        ...state,
        generalStepErrors: { ...state.generalStepErrors, image_url: undefined },
      }));
    },
    setGeneralStepErrors: (errors) => {
      set((state) => ({
        ...state,
        generalStepErrors: errors,
      }));
    },
    setTimePlaceStepErrors(errors) {
      set((state) => ({
        ...state,
        timeplaceStepErrors: errors,
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
    clearTimePlaceStepErrors() {
      set((state) => {
        return {
          ...state,
          timeplaceStepErrors: {},
        };
      });
    },
    setCurrentStep: (step: number) =>
      set((state) => ({ ...state, currentStep: step })),
    setEventData: (data: z.infer<typeof EventDataSchemaAllOptional>) =>
      set((state) => {
        return {
          ...state,
          eventData: {
            ...state.eventData,
            hasEnded: !!(
              state.edit?.eventHash &&
              state?.eventData?.end_date &&
              state.eventData.end_date < Date.now() / 1000
            ),
            ...data,
          },
        };
      }),
    setEdit: (edit: { eventHash?: string }) =>
      set((state) => ({ ...state, edit })),

    resetState: () => {
      set(() => ({
        currentStep: 1,
        eventData: { dynamic_fields: [], type: 0, owner: 0, hasEnded: true },
        edit: {},
      }));
    },
  }))
);
