import "dotenv/config";

import express from "express";
import { Bot, session } from "grammy";

import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import {
	handleFileSend,
	handleSendQRCode,
	handleShareEvent,
	sendMessage,
	handlePhotoMessage,
	handleShareOrganizer,
} from "./controllers";
import { orgHandler, startHandler } from "./handlers";
import { mainComposer } from "./composers";
// parse application/json

const bot = new Bot(process.env.BOT_TOKEN || "");
bot.use(session({ initial: () => ({}) }));
console.log("Starting bot... v2");

bot.command("org", orgHandler);
bot.command("start", startHandler);

bot.use(mainComposer);

bot.start();
bot.catch((err) => {
	console.log("BOT_ERROR_HANDLER", err);
});

// -------- EXPRESS APP --------- 👇

const port = process.env.TELEGRAM_BOT_PORT || 3333;
const app = express();

app.use(bodyParser.json());

app.use(fileUpload());
app.use((req, _, next) => {
	// @ts-expect-error fix express.d.ts
	req.bot = bot;
	next();
});

app.post("/send-file", handleFileSend);
app.get("/generate-qr", handleSendQRCode);
app.post("/share-event", handleShareEvent);
// @ts-expect-error
app.post("/send-message", sendMessage);
app.post("/send-photo", handlePhotoMessage);
app.post("/share-organizer", handleShareOrganizer);

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

app.listen(port, () => console.log(`Example app listening on port ${port}`));

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
