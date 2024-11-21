import {
  GeneralFormErrors,
  RewardFormErrors,
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
  edit?: {
    eventHash?: string;
  };
  setEventData: (_data: z.infer<typeof EventDataSchemaAllOptional>) => void;
  setEdit: (_edit: { eventHash?: string }) => void;
  resetState: () => void;
  // form errors
  generalStepErrors?: GeneralFormErrors;
  timeplaceStepErrors?: TimePlaceFormErorrs;
  rewardStepErrors?: RewardFormErrors;
  // set errors
  setGeneralStepErrors: (_: GeneralFormErrors) => void;
  setTimePlaceStepErrors: (_: TimePlaceFormErorrs) => void;
  setRewardStepErrors: (_: RewardFormErrors) => void;
  // clear errors
  clearGeneralStepErrors: () => void;
  clearRewardStepErrors: () => void;
  clearTimePlaceStepErrors: () => void;
  clearImageErrors: () => void;
  resetReward: () => void;
};

const defaultState = {
  event: {
    dynamic_fields: [],
    owner: 0,
    type: 0,
    hasEnded: true,
  },
  step: 1,
};

export const useCreateEventStore = create(
  devtools<CreateEventStoreType>((set) => ({
    currentStep: defaultState.step,
    eventData: defaultState.event,
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
    setRewardStepErrors: (errors) => {
      set((state) => ({
        ...state,
        rewardStepErrors: errors,
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
    clearRewardStepErrors: () => {
      set((state) => ({
        ...state,
        rewardStepErrors: {},
      }));
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
        currentStep: defaultState.step,
        eventData: defaultState.event,
        edit: {},
      }));
    },
    resetReward: () => {
      set((state) => ({
        ...state,
        eventData: {
          hasEnded: true,
          ...state.eventData,
          video_url: "",
          ts_reward_url: "",
        },
      }));
    },
  }))
);
