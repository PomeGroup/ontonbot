import "dotenv/config"

import express from "express"
import { Telegraf } from "telegraf"

import fileUpload from "express-fileupload"
import { handleFileSend, handleSendQRCode, handleShareEvent } from "./controllers"
import { orgHandler, startHandler } from "./handlers"

const port = 3333;

const bot = new Telegraf(process.env.BOT_TOKEN || "");
console.log("Starting bot... v2");
console.log(process.env.BOT_TOKEN || "");

bot.start(startHandler);

bot.command("org", orgHandler);

const app = express();
app.use(fileUpload());
app.use((req, res, next) => {
  // @ts-expect-error fix express.d.ts
  req.bot = bot;
  next();
});

app.post("/send-file", handleFileSend);
app.get("/generate-qr", handleSendQRCode);
app.get("/share-event", handleShareEvent);

bot.catch((err) => console.error(err));

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

app.listen(port, () => console.log(`Example app listening on port ${port}`));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

