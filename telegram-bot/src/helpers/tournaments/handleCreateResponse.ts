import { MyContext } from "src/types/MyContext";

export function handleCreateResponse(ctx: MyContext, finalData: any) {

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
