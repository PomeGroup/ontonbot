import { Composer } from "grammy";
import { MyContext } from "../types/MyContext";
import { logger } from "../utils/logger";

// We'll store progress in ctx.session.tournamentStep,
// and temporarily store the gathered data in ctx.session.tournamentData
export const tournamentComposer = new Composer<MyContext>();

// 1) Command: /tournament => begin flow
tournamentComposer.command("tournament", async (ctx) => {
  // Reset any existing flow state
  ctx.session.tournamentStep = "askGameId";
  ctx.session.tournamentData = {
    gameId: "",
    tournamentId: "",
    photoFileId: "",
  };

  await ctx.reply("Please send me the *Game ID* now.", {
    parse_mode: "Markdown",
  });
});

// 2) On text messages => check what step we are in
tournamentComposer.on("message:text", async (ctx, next) => {
  // If we're not in a tournament flow, pass to other handlers
  if (!ctx.session.tournamentStep) {
    return next();
  }

  // Handle the step logic
  if (ctx.session.tournamentStep === "askGameId") {
    // 2a) Store Game ID
    const gameId = ctx.message.text.trim();
    ctx.session.tournamentData.gameId = gameId;

    // Proceed to next step
    ctx.session.tournamentStep = "askTournamentId";
    await ctx.reply(
      `Got the Game ID: *${gameId}*\n\nNow please send me the *Tournament ID*.`,
      { parse_mode: "Markdown" },
    );
  } else if (ctx.session.tournamentStep === "askTournamentId") {
    // 2b) Store Tournament ID
    const tournamentId = ctx.message.text.trim();
    ctx.session.tournamentData.tournamentId = tournamentId;

    // Proceed to next step => ask for a photo
    ctx.session.tournamentStep = "askTournamentPhoto";
    await ctx.reply(
      `Got the Tournament ID: *${tournamentId}*\n\nNow please send a photo for the tournament (attach as an image).`,
      { parse_mode: "Markdown" },
    );
  } else {
    // If user sent text but we expected a photo, ignore or remind them
    if (ctx.session.tournamentStep === "askTournamentPhoto") {
      await ctx.reply("Please send a photo (image) for the tournament.");
    }
  }
});

// 3) On photo messages => final step
tournamentComposer.on("message:photo", async (ctx) => {
  // Only handle if we are asking for the photo
  if (ctx.session.tournamentStep !== "askTournamentPhoto") return;

  // We'll pick the highest resolution photo from photo array
  const photos = ctx.message.photo;
  const largestPhoto = photos[photos.length - 1];
  const fileId = largestPhoto.file_id;

  // Save it in session
  ctx.session.tournamentData.photoFileId = fileId;

  // Now we have all pieces of data => print it out
  const { gameId, tournamentId, photoFileId } = ctx.session.tournamentData;
  await ctx.reply(
    `Great! Here’s what we received:\n\n` +
    `**Game ID**: \`${gameId}\`\n` +
    `**Tournament ID**: \`${tournamentId}\`\n` +
    `**Photo File ID**: \`${photoFileId}\``,
    { parse_mode: "Markdown" },
  );

  // You might optionally send the photo back as confirmation
  await ctx.replyWithPhoto(photoFileId);

  // Reset the flow
  ctx.session.tournamentStep = undefined;
  ctx.session.tournamentData = undefined;
});

