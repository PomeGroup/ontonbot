import { RouterOutput } from "@/server";
import { create } from "zustand";

type User = RouterOutput["users"]["syncUser"];
type UserStore = {
  user: User | null;
  initData: string;
  setInitData: Function;
  setUser: Function;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  initData: null as unknown as string,
  setInitData: (initData: string) => set((state) => ({ ...state, initData })),
  setUser: (user: User) => set((state) => ({ ...state, user })),
}));
