import { Composer } from "grammy";
import { broadcastComposer } from "./broadcast";

// join other composers here
export const mainComposer = new Composer()

mainComposer.use(broadcastComposer)
