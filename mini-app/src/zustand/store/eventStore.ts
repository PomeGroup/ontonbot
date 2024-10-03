// src/store/eventStore.ts
import { create } from "zustand";
import { ReactNode } from "react";

type EventAttributes = [string, ReactNode][];

interface EventStoreState {
  attributes: EventAttributes;
  setAttributes: (newAttributes: EventAttributes) => void;
}

export const useEventStore = create<EventStoreState>((set) => ({
  attributes: [],
  setAttributes: (newAttributes) => set(() => ({ attributes: newAttributes })),
}));
