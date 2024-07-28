import "dotenv/config";

import express from "express";
import { Telegraf } from "telegraf";

import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import {
  handleFileSend,
  handleSendQRCode,
  handleShareEvent,
} from "./controllers";
import { orgHandler, startHandler } from "./handlers";
import { CronJob } from "cron";
import axios from "axios";
// parse application/json

const port = 3333;

const bot = new Telegraf(process.env.BOT_TOKEN || "");
console.log("Starting bot... v2");
console.log(process.env.BOT_TOKEN || "");

bot.start(startHandler);

bot.command("org", orgHandler);

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

bot.catch((err) => console.error(err));

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

app.listen(port, () => console.log(`Example app listening on port ${port}`));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// start
new CronJob(
  "*/10 * * * *",
  () => {
    console.log("hello champ");
    axios
      .get(`${process.env.APP_BASE_URL}/api/v1/cron`)
      .then((r) => console.log(r.data));
  },
  null,
  true,
);
