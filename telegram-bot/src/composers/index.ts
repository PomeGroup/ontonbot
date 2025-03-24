import { Composer } from "grammy";
import { affiliateComposer } from "./affiliateComposer";
import { broadcastComposer } from "./broadcast";
import { groupComposer } from "./groupComposer";
import { play2winFeatured } from "./play2winfetured";
import { sbtdistComposer } from "./sbtdistComposer";
import { tournamentComposer } from "./tournamentComposer";
import { cancelComposer } from "./cancelComposer";
import { collectionComposer } from "../composers/collectionComposer";
import { toIdComposer } from "../composers/toIdComposer";

// join other composers here
export const mainComposer = new Composer();

mainComposer.use(broadcastComposer);
mainComposer.use(sbtdistComposer);
mainComposer.use(affiliateComposer);
mainComposer.use(groupComposer);
mainComposer.use(tournamentComposer);
mainComposer.use(play2winFeatured);
mainComposer.use(collectionComposer);
mainComposer.use(toIdComposer);
mainComposer.use(cancelComposer);
