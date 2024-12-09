import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {} from "@redux-devtools/extension"; // required for devtools typing

interface State {
  anyOpen: boolean; // if there is any sheet open currently
  openCount: number; // number of open sheets
}

interface Actions {
  openOne: () => void;
  closeOne: () => void;
}

type SheetStackState = State & Actions;

/**
 * This state is used to track the number of open sheets (drawers from konst)
 * This state will also handle main button in which it will either hide/show it on open/close state
 */
export const useSheetStackStore = create<SheetStackState>()(
  devtools(
    immer((set) => {
      return {
        anyOpen: false,
        openCount: 0,
        openOne: () =>
          set((state) => {
            state.openCount++;
            state.anyOpen = true;
          }),
        closeOne: () => {
          set((state) => {
            state.openCount--;
            state.anyOpen = state.openCount > 0;
          });
        },
      };
    })
  )
);
