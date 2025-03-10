import { Composer } from "grammy";
import { broadcastComposer } from "./broadcast";
import { sbtdistComposer } from "./sbtdistComposer";
import { affiliateComposer } from "./affiliateComposer";
import { groupComposer } from "./groupComposer";
import { tournamentComposer } from "./tournamentComposer";

// join other composers here
export const mainComposer = new Composer();

mainComposer.use(broadcastComposer);
mainComposer.use(sbtdistComposer);
mainComposer.use(affiliateComposer);
mainComposer.use(groupComposer);
mainComposer.use(tournamentComposer);
