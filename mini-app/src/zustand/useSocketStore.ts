import { create } from "zustand";
import { Socket } from "socket.io-client";

type SocketState = {
  socket: Socket | null;
  setSocket: (_socket: Socket | null) => void;
};

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
}));
