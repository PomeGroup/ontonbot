import { RouterOutput } from '@/server'
import { create } from 'zustand'

type User = RouterOutput['users']['syncUser']
type UserStore = { user: User | null, setUser: Function }

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: User) => set(() => ({ user }))
}))
