import { Composer } from "grammy";
import { broadcastComposer } from "./broadcast";
import { sbtdistComposer } from "./sbtdistComposer";

// join other composers here
export const mainComposer = new Composer();

mainComposer.use(broadcastComposer);
mainComposer.use(sbtdistComposer);
