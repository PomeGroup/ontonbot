import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {} from "@redux-devtools/extension"; // required for devtools typing

interface State {
  anyOpen: boolean; // if there is any sheet open currently
  openCount: number; // number of open sheets
  wasMainButtonVisible: boolean;
}

interface Actions {
  openedOneSheet: () => void;
  closedOneSheet: () => void;
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
        wasMainButtonVisible: false,
        openedOneSheet: () =>
          set((state) => {
            state.openCount++;
            state.anyOpen = true;
            const isVisible = window.Telegram.WebApp.MainButton.isVisible;
            if (isVisible) {
              state.wasMainButtonVisible = true;
              window.Telegram.WebApp.MainButton.hide();
            } else {
              state.wasMainButtonVisible = false;
            }
          }),
        closedOneSheet: () => {
          set((state) => {
            if (state.anyOpen) {
              state.openCount--;
              state.anyOpen = state.openCount > 0;
              !state.anyOpen && state.wasMainButtonVisible && window.Telegram.WebApp.MainButton.show();
            }
          });
        },
      };
    })
  )
);
