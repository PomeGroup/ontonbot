import "dotenv/config"

import express from "express"
import { Telegraf } from "telegraf"

import bodyParser from "body-parser"
import fileUpload from "express-fileupload"
import {
  handleFileSend,
  handleSendQRCode,
  handleShareEvent,
  sendMessage,
} from "./controllers"
import { orgHandler, startHandler } from "./handlers"
// parse application/json
import { HttpsProxyAgent } from 'https-proxy-agent'

console.log(process.env.TG_PROXY);

const agent = process.env.TG_PROXY && new HttpsProxyAgent(process.env.TG_PROXY);
const port = 3333;

const bot = new Telegraf(process.env.BOT_TOKEN || "", {
  telegram: {
    agent
  }});
console.log("Starting bot... v2");
console.log(process.env.BOT_TOKEN || "");

bot.start(startHandler);

bot.command("org", orgHandler)

const app = express();

app.use(bodyParser.json());

app.use(fileUpload());
app.use((req, res, next) => {
  // @ts-expect-error fix express.d.ts
  req.bot = bot;
  next();
});

app.post("/send-file", handleFileSend);
app.get("/generate-qr", handleSendQRCode);
app.post("/share-event", handleShareEvent);
// @ts-expect-error
app.post("/send-message", sendMessage);

bot.catch((err) => console.error(err));

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

app.listen(port, () => console.log(`Example app listening on port ${port}`));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
