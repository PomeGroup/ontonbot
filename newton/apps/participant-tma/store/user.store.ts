import { create } from "zustand";

import { UserStoreType, UserType } from "~/types/user.types";

export const useUserStore = create<UserStoreType>((set) => ({
  user: null,
  setUser: (user: UserType) => set({ user }),
  resetUser: () => set({ user: null }),
}));
