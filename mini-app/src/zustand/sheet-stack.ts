import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {} from "@redux-devtools/extension"; // required for devtools typing

interface State {
  anyOpen: boolean; // if there is any sheet open currently
  openCount: number; // number of open sheets
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
export const useSheetStack = create<SheetStackState>()(
  devtools(
    immer((set) => {
      return {
        anyOpen: false,
        openCount: 0,
        openedOneSheet: () =>
          set((state) => {
            state.openCount++;
            state.anyOpen = true;
            const isVisible = window.Telegram.WebApp.MainButton.isVisible;
            isVisible && window.Telegram.WebApp.MainButton.hide();
          }),
        closedOneSheet: () => {
          set((state) => {
            console.log("open count", state.openCount);
            state.openCount--;
            console.log("open count", state.openCount);
            state.anyOpen = state.openCount > 0;
            !state.anyOpen && window.Telegram.WebApp.MainButton.show();
          });
        },
      };
    })
  )
);
