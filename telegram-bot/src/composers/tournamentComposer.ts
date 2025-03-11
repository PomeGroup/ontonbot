import axios, { AxiosError } from "axios"
import FormData from "form-data"
import { Composer, InlineKeyboard } from "grammy"
import * as process from "node:process"
import { MyContext } from "../types/MyContext"
import { logger } from "../utils/logger"

export const tournamentComposer = new Composer<MyContext>();

// 1) Command: /tournament => begin flow
tournamentComposer.command("tournament", async (ctx) => {
  // Clear any prior session state
  ctx.session.tournamentStep = "askGameId";
  ctx.session.tournamentData = {
    gameId: "",
    tournamentId: "",
    tournamentLink: "",
    photoFileId: "",
  };

  await ctx.reply("Please send me the **Game ID** now.");
});

// 2) On text => handle flow logic
tournamentComposer.on("message:text", async (ctx, next) => {
  if (!ctx.session.tournamentStep) return next();

  // (A) Ask for Game ID
  if (ctx.session.tournamentStep === "askGameId") {
    const gameId = ctx.message.text.trim();
    ctx.session.tournamentData.gameId = gameId;

    ctx.session.tournamentStep = "askTournamentId";
    await ctx.reply(`Game ID saved: ${gameId}\nNow send me the **Tournament ID**.`);
    return;
  }

  // (B) Ask for Tournament ID
  if (ctx.session.tournamentStep === "askTournamentId") {
    const tournamentId = ctx.message.text.trim();
    ctx.session.tournamentData.tournamentId = tournamentId;

    // Next => call "check" endpoint
    ctx.session.tournamentStep = "check";
    await ctx.reply(`Tournament ID saved: ${tournamentId}\nChecking...`);

    return doCheckEndpoint(ctx);
  }

  // (C) If user chooses "Insert," we ask for the link => "askTournamentLink"
  if (ctx.session.tournamentStep === "askTournamentLink") {
    // Store the tournament link
    const link = ctx.message.text.trim();
    ctx.session.tournamentData.tournamentLink = link;

    // Next => ask photo
    ctx.session.tournamentStep = "askTournamentPhoto";
    await ctx.reply(
      `Tournament link saved: ${link}\nNow please send a **photo** for the tournament.`,
    );
    return;
  }

  // If user typed text but we’re expecting a photo or something else
  await ctx.reply("Please follow instructions or type /tournament to start again.");
});

// 3) Callback => Insert / Create / Cancel
tournamentComposer.callbackQuery(["tourn_insert", "tourn_create", "tourn_cancel"], async (ctx) => {
  await ctx.answerCallbackQuery();

  if (ctx.callbackQuery.data === "tourn_cancel") {
    resetTournamentFlow(ctx);
    await ctx.reply("Operation canceled. /tournament to start over.");
    return;
  }

  // If user tapped "Insert" => from confirmInsert step => ask for link
  if (ctx.session.tournamentStep === "confirmInsert" && ctx.callbackQuery.data === "tourn_insert") {
    ctx.session.tournamentStep = "askTournamentLink";
    await ctx.reply("Please send me the **Tournament Link** now (or type 'skip'):");
    return;
  }

  // If user tapped "Create" => from confirmCreate step => skip link or do the same?
  // If your logic also wants a link for "create," do the same step:
  if (ctx.session.tournamentStep === "confirmCreate" && ctx.callbackQuery.data === "tourn_create") {
    ctx.session.tournamentStep = "askTournamentLink";
    await ctx.reply("Please send me the **Tournament Link** now (or type 'skip'):");
    return;
  }
});

// 4) On receiving a photo => finalize creation flow
tournamentComposer.on("message:photo", async (ctx) => {
  if (ctx.session.tournamentStep !== "askTournamentPhoto") return;

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
    formData.append("file", fileBuffer, { filename: "my_tournament_photo.png", contentType: "image/png" });
    // Also append "tournament_link" if user typed one
    if (tournamentLink && tournamentLink.toLowerCase() !== "skip") {
      formData.append("tournament_link", tournamentLink);
    }

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
  const url = `${baseUrl}/tournament/check/${ctx.session.tournamentData.gameId}/${ctx.session.tournamentData.tournamentId}/${userId}`;
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
      `Name: ${details.Name}\nState: ${details.State}\nOwnerId: ${details.OwnerId ?? "(none)"}\n...`,
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
      const kb = new InlineKeyboard().text("Create", "tourn_create").text("Cancel", "tourn_cancel");
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
