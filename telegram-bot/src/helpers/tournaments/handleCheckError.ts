import { MyContext } from "../../types/MyContext";
import axios, { AxiosError } from "axios";
import { logger } from "../../utils/logger";
import { InlineKeyboard } from "grammy";
import { resetTournamentFlow } from "./resetTournamentFlow";

export function handleCheckError(ctx: MyContext, error: unknown) {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError;
    const status = axErr.response?.status;
    const data = axErr.response?.data as any;
    const msg = data?.message;

    if (status === 404) {
      logger.warn("Tournament not found => 404 => user can create new.");
      const kb = new InlineKeyboard()
        .text("Create", "tourn_create")
        .text("Cancel", "tourn_cancel");
      ctx.reply("Tournament not found in Elympics. Create it anyway?", {
        reply_markup: kb,
      });
      ctx.session.tournamentStep = "confirmCreate";
    } else if (status === 400 && msg === "mismatched_game_id") {
      ctx.reply("Game ID does not match Elympics data. Aborting.");
      resetTournamentFlow(ctx);
    } else if (status === 400 && msg === "invalid_mode") {
      ctx.reply("Invalid mode from server. Aborting.");
      resetTournamentFlow(ctx);
    } else if (status === 500 && msg === "elympics_fetch_error") {
      ctx.reply("Server encountered an error fetching Elympics. Try again later.");
      resetTournamentFlow(ctx);
    } else {
      logger.error("Check endpoint error =>", msg || axErr.message);
      ctx.reply("Error during check. Please try again later.");
      resetTournamentFlow(ctx);
    }
  } else {
    ctx.reply("Unknown check error. Please try again later.");
    resetTournamentFlow(ctx);
  }
}
