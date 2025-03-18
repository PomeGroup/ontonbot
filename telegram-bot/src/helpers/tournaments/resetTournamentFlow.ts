import { MyContext } from "src/types/MyContext";

export function resetTournamentFlow(ctx: MyContext) {
  ctx.session.tournamentStep = "done";
  ctx.session.tournamentData = undefined;
}