// src/store/eventStore.ts
import { create } from "zustand";
import { ReactNode } from "react";

// Define EventAttributes type
type EventAttributes = [string, ReactNode][];
type TicketAttributes = [string, ReactNode][]; // New type for ticket attributes

// Extend the EventStoreState interface to include ticketAttributes
interface EventStoreState {
  attributes: EventAttributes;
  setAttributes: (_newAttributes: EventAttributes) => void;
  ticketAttributes: TicketAttributes; // New ticketAttributes property
  setTicketAttributes: (_newTicketAttributes: TicketAttributes) => void; // New setter for ticketAttributes
}

// Create Zustand store with event and ticket attributes
export const useEventStore = create<EventStoreState>((set) => ({
  attributes: [], // Initial state for event attributes
  setAttributes: (newAttributes: EventAttributes) =>
    set(() => ({ attributes: newAttributes })),

  ticketAttributes: [], // Initial state for ticket attributes
  setTicketAttributes: (newTicketAttributes: TicketAttributes) =>
    set(() => ({ ticketAttributes: newTicketAttributes })),
}));
