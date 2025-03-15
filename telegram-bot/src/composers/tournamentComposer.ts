import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { Composer, InlineKeyboard } from "grammy";
import * as process from "node:process";
import { MyContext } from "../types/MyContext";
import { logger } from "../utils/logger";
import { isNewCommand } from "../helpers/isNewCommand";
import { GameRowType, getGames } from "../db/db";

export const tournamentComposer = new Composer<MyContext>();

/**
 * Utility function to parse the invite message and extract:
 *   - the entire link: e.g. "t.me/xxx?start=xxx-league-YYY"
 *   - the tournament ID from after the last dash: "YYY" in the example
 */
function parseInviteMessage(text: string) {
  // 1) Find "t.me/..." in the message
  const linkRegex = /(t\.me\/[^\s]+)/i;
  const match = text.match(linkRegex);

  if (!match) {
    return { link: null, tournamentId: null };
  }

  // 2) Extract the link from "t.me..." up to next whitespace
  let link = match[1];

  // 3) Ensure the link starts with "https://"
  //    or "http://". If not, prepend "https://".
  if (!/^https?:\/\//i.test(link)) {
    link = "https://" + link;
  }

  // Example link: https://t.me/cut_the_zero_bot?start=code-fsghgoji__league-slpbcmb6
  // We want the portion after the last dash => "slpbcmb6"
  const dashIndex = link.lastIndexOf("-");
  if (dashIndex === -1) {
    // If there's no dash, we can't parse a tournament ID
    return { link, tournamentId: null };
  }

  // 4) Extract everything after the dash
  const tournamentId = link.slice(dashIndex + 1);

  // 5) Return both
  return { link, tournamentId };
}

// 1) Command: /tournament => begin flow
tournamentComposer.command("tournament", async (ctx) => {
  // Clear any prior session state
  ctx.session.tournamentStep = "pickGame";
  ctx.session.tournamentData = {
    gameId: "",
    tournamentId: "",
    tournamentLink: "",
    photoFileId: "",
  };

  // Fetch games from DB
  let games: GameRowType[];
  try {
    games = await getGames(); // => [{ name, host_game_id }, ...]
  } catch (error) {
    await ctx.reply("Failed to fetch games from database. Please try again later.");
    logger.error("Error fetching games =>", error);
    return;
  }

  // Build an inline keyboard of the returned games
  const kb = new InlineKeyboard();
  for (const game of games) {
    // We'll store the host_game_id in the callback data
    kb.text(game.name, `pick_game_${game.host_game_id}`).row();
  }

  if (games.length === 0) {
    await ctx.reply("No games found in the database.");
    return;
  }

  await ctx.reply("Please pick a game from the list below:", {
    reply_markup: kb,
  });
});

// 2) Callback query => handle game selection
tournamentComposer.callbackQuery(/^pick_game_(.+)$/, async (ctx) => {
  const selectedGameId = ctx.match[1]; // The part after "pick_game_"
  await ctx.answerCallbackQuery();

  // Store the selected game ID in session
  ctx.session.tournamentData.gameId = selectedGameId;
  ctx.session.tournamentStep = "askInviteMessage";

  await ctx.reply(
    `Game selected: ${selectedGameId}\n` +
    `Now please **forward** or **paste** the full invite message.`,
  );
});

// 3) On text => handle the invite message
tournamentComposer.on("message:text", async (ctx, next) => {
  if (!ctx.session.tournamentStep) return next();
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  // We expect user to send the invite message
  if (ctx.session.tournamentStep === "askInviteMessage") {
    const text = ctx.message.text;
    const { link, tournamentId } = parseInviteMessage(text);

    if (!link || !tournamentId) {
      await ctx.reply(
        "Could not find a valid link or tournament ID in your message.\n" +
        "Please make sure to send the exact invite message that includes the link with a dash.",
      );
      return;
    }

    // Store in session
    ctx.session.tournamentData.tournamentLink = link;
    ctx.session.tournamentData.tournamentId = tournamentId;

    // Next => call "check" endpoint
    ctx.session.tournamentStep = "check";
    await ctx.reply(
      `Invite link parsed: ${link}\nTournament ID parsed: ${tournamentId}\nChecking...`,
    );

    return doCheckEndpoint(ctx);
  }


});

// 4) Callback => Insert / Create / Cancel
tournamentComposer.callbackQuery(["tourn_insert", "tourn_create", "tourn_cancel"], async (ctx) => {
  await ctx.answerCallbackQuery();

  if (ctx.callbackQuery.data === "tourn_cancel") {
    resetTournamentFlow(ctx);
    await ctx.reply("Operation canceled. /tournament to start over.");
    return;
  }

  // If user tapped "Insert" => from confirmInsert step => ask for photo
  if (ctx.session.tournamentStep === "confirmInsert" && ctx.callbackQuery.data === "tourn_insert") {
    ctx.session.tournamentStep = "askTournamentPhoto";
    await ctx.reply("Please send me a **photo** for the tournament now.");
    return;
  }

  // If user tapped "Create" => from confirmCreate step => ask for photo
  if (ctx.session.tournamentStep === "confirmCreate" && ctx.callbackQuery.data === "tourn_create") {
    ctx.session.tournamentStep = "askTournamentPhoto";
    await ctx.reply("Please send me a **photo** for the tournament now.");
    return;
  }
});

// 5) On receiving a photo => finalize creation flow
tournamentComposer.on("message:photo", async (ctx, next) => {
  if (ctx.session.tournamentStep !== "askTournamentPhoto") return next();
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const { gameId, tournamentId, tournamentLink } = ctx.session.tournamentData ?? {};
  if (!gameId || !tournamentId) {
    await ctx.reply("Missing IDs in session. Please /tournament to start again.");
    resetTournamentFlow(ctx);
    return;
  }

  await ctx.reply("Uploading photo, please wait...");

  // Download from Telegram
  let fileBuffer: Buffer;
  try {
    const photoArr = ctx.message.photo;
    const fileId = photoArr[photoArr.length - 1].file_id;
    const fileInfo = await ctx.api.getFile(fileId);
    const downloadUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${fileInfo.file_path}`;
    const resp = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    fileBuffer = Buffer.from(resp.data);
  } catch (err) {
    logger.error("Error downloading photo =>", err);
    await ctx.reply("Failed to download the photo. Try again.");
    return;
  }

  // Now call the create endpoint
  try {
    const userId = ctx.from?.id || 0;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const createUrl = `${baseUrl}/tournament/create/${gameId}/${tournamentId}/${userId}`;
    logger.info("Create URL => " + createUrl);

    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: "my_tournament_photo.png",
      contentType: "image/png",
    });

    // Include the link we parsed from the invite message
    formData.append("tournament_link", tournamentLink);

    logger.info("Form data =>", formData);
    const res = await axios.post(createUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "x-api-key": process.env.ONTON_API_KEY || "",
      },
    });

    const finalData = res.data;
    handleCreateResponse(ctx, finalData);
  } catch (err) {
    handleCreateError(ctx, err);
  } finally {
    resetTournamentFlow(ctx);
  }
});

/* -------------------------------------------------------------------------- */
/*                          Checking Endpoint Flow                            */

/* -------------------------------------------------------------------------- */

async function doCheckEndpoint(ctx: MyContext) {
  const userId = ctx.from?.id || 0;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const { gameId, tournamentId } = ctx.session.tournamentData!;
  const url = `${baseUrl}/tournament/check/${gameId}/${tournamentId}/${userId}`;
  logger.info("Check URL => " + url);

  try {
    const res = await axios.post(url, {}, {
      headers: {
        "x-api-key": process.env.ONTON_API_KEY || "",
      },
    });

    const details = res.data?.data;
    if (!details) {
      await ctx.reply("No details returned from check. Possibly unknown error.");
      resetTournamentFlow(ctx);
      return;
    }

    // Show info
    await ctx.reply(
      `Tournament found in Elympics:\n` +
      `Name: ${details.Name}\n` +
      `State: ${details.State}\n` +
      `OwnerId: ${details.OwnerId ?? "(none)"}\n...`,
    );

    // Offer to insert
    const kb = new InlineKeyboard()
      .text("Insert", "tourn_insert")
      .text("Cancel", "tourn_cancel");
    await ctx.reply("Would you like to insert this tournament in local DB?", {
      reply_markup: kb,
    });
    ctx.session.tournamentStep = "confirmInsert";
  } catch (err) {
    handleCheckError(ctx, err);
  }
}

/* -------------------------------------------------------------------------- */
/*                       Error & Response Handling Helpers                    */

/* -------------------------------------------------------------------------- */

function resetTournamentFlow(ctx: MyContext) {
  ctx.session.tournamentStep = "done";
  ctx.session.tournamentData = undefined;
}

function handleCheckError(ctx: MyContext, error: unknown) {
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

function handleCreateError(ctx: MyContext, error: unknown) {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError;
    const data = axErr.response?.data as any;
    const msg = data?.message;
    logger.error("Error calling create =>", msg || axErr.message);
    ctx.reply(`Failed to create tournament. Error: ${msg || axErr.message}`);
  } else {
    ctx.reply("Failed to create tournament. Please try again later.");
  }
}

function handleCreateResponse(ctx: MyContext, finalData: any) {

  const msg = finalData?.message;
  if (!msg) {
    ctx.reply("No message returned from create endpoint. Possibly unknown error.");
    return;
  }

  switch (msg) {
    case "success":
      if (finalData.tournament) {
        ctx.reply(
          `Tournament inserted!\n` +
          `Local ID: ${finalData.tournament.id}\n` +
          `State: ${finalData.tournament.state}`,
        );
      } else {
        ctx.reply("Tournament created, but no tournament data returned.");
      }
      break;

    case "Image must be square.":
      ctx.reply("The server says the image must be square. Please retry with a square photo.");
      break;

    case "db_insert_error":
      ctx.reply("Database insert error. Possibly a duplicate or internal error.");
      break;

    case "duplicate_tournament":
      ctx.reply("That tournament was already inserted. No changes made.");
      break;

    case "mismatched_game_id":
      ctx.reply("Server says the game ID does not match Elympics data. Aborting.");
      break;

    default:
      ctx.reply(`Tournament creation responded: ${JSON.stringify(finalData)}`);
      break;
  }
}
