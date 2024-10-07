import { create } from "zustand";

// Define TypeScript interfaces for the store state and actions
interface DynamicField {
  id: string | number;
  value: string;
}

interface StoreState {
  dynamicFields: DynamicField[];
  completedTaskIds: Set<string | number>; // Track IDs of completed tasks
  totalDynamicTasks: number; // The total number of dynamic tasks expected
  walletConnected: boolean;
  addDynamicField: (_field: DynamicField) => void;
  markTaskCompleted: (_taskId: string | number) => void;
  markTaskUncompleted: (_taskId: string | number) => void; // New method to uncomplete tasks
  setTotalDynamicTasks: (_total: number) => void;
  setWalletConnected: (_status: boolean) => void;
  allTasksCompleted: () => boolean;
}

export const useCompleteStore = create<StoreState>((set) => ({
  dynamicFields: [],
  completedTaskIds: new Set(),
  totalDynamicTasks: 0,
  walletConnected: false,

  addDynamicField: (field) =>
    set((state) => ({
      dynamicFields: [...state.dynamicFields, field],
    })),

  markTaskCompleted: (taskId) =>
    set((state) => {
      const updatedCompletedTaskIds = new Set(state.completedTaskIds);
      updatedCompletedTaskIds.add(taskId);
      return { completedTaskIds: updatedCompletedTaskIds };
    }),

  markTaskUncompleted: (taskId) =>
    set((state) => {
      const updatedCompletedTaskIds = new Set(state.completedTaskIds);
      if (updatedCompletedTaskIds.has(taskId)) {
        updatedCompletedTaskIds.delete(taskId);
      }
      return { completedTaskIds: updatedCompletedTaskIds };
    }),

  setTotalDynamicTasks: (total) => set({ totalDynamicTasks: total }),

  setWalletConnected: (status) => set({ walletConnected: status }),

  allTasksCompleted: () => {
    const state: any = useCompleteStore.getState();
    return (
      state.walletConnected &&
      state.completedTaskIds.size === state.totalDynamicTasks
    );
  },
}));
