import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import fs from "fs";
import QRCode from "qrcode";
import sharp from "sharp";
import { getEvent } from "./db/db";
import { shareKeyboard } from "./markups";
import axios from "axios";
import { Bot, GrammyError, InputFile } from "grammy";

export const handleSendQRCode = async (
	req: Request & { bot: Bot },
	res: Response
) => {
	const { url, hub, id } = req.query;

	if (!url || typeof url !== "string" || !id || typeof id !== "string") {
		return res.status(400).send("URL is required");
	}

	try {
		// Generate QR code with transparent background
		const qrBuffer = await QRCode.toBuffer(url, {
			color: {
				dark: "#000000", // QR code color
				light: "#0000", // Transparent background
			},
			errorCorrectionLevel: "H",
		});

		// Resize QR code to fit well on the base image
		const resizedQRBuffer = await sharp(qrBuffer)
			.resize(700, 700) // Adjust this value as needed
			.png() // Ensure the output is PNG to maintain transparency
			.toBuffer();

		// Determine the base layer image path
		let baseImagePath = `./img/${hub === "Hong Kong" ? "SEA" : hub}.png`;
		if (!fs.existsSync(baseImagePath)) {
			baseImagePath = "./img/onton.png";
		}

		// Read the base layer image into a buffer
		const baseImageBuffer = fs.readFileSync(baseImagePath);

		// Combine the base layer and resized QR code with the QR code in the center
		const imageToSend = await sharp(baseImageBuffer)
			.composite([{ input: resizedQRBuffer, gravity: "center" }])
			.toBuffer();

		const imageFile = new InputFile(imageToSend);
		// Send the combined image
		await req.bot.api.sendPhoto(id, imageFile, {
			caption: `🔗 Scan QR code or share the link:\n\n${url.replace(
				"https://",
				""
			)}`,
			reply_markup: shareKeyboard(url),
		});

		return res.status(200).send("Success");
	} catch (error) {
		console.error(error);
		return res.status(500).send("Internal Server Error");
	}
};

export const handleFileSend = async (
	req: Request & { bot: Bot },
	res: Response
) => {
	const { id } = req.query;
	const { message, fileName } = req.body; // Assuming the custom message is sent in the request body
	// Custom function to sanitize the file name
	const sanitizeFileName = (name: string) => {
		return name.replace(/[^a-zA-Z0-9._-]/g, "_"); // Replace invalid characters with underscore
	};
	if (!id || typeof id !== "string") {
		return res.status(400).send("User ID is required");
	}

	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send("No files were uploaded.");
	}

	// Ensure the file is correctly typed as UploadedFile (not an array of files)
	const file = req.files.file as UploadedFile; // Adjust if supporting multiple files

	// Set the default caption if none is provided
	const caption = message || "📄 Here is your file.";
	// Sanitize the file name
	const sanitizedFileName = sanitizeFileName(fileName || "visitors");

	try {
		// Ensure 'file.data' is used, which is a Buffer
		const dataFile = new InputFile(file.data, `${sanitizedFileName}.csv`);
		await req.bot.api.sendDocument(
			id,
			dataFile,
			{ caption: caption } // Use the provided caption or the default
		);

		return res.status(200).send("Success");
	} catch (error) {
		console.error(error);
		return res.status(500).send("Internal Server Error");
	}
};

const processAndSendImage = async (
	event: any,
	userId: string,
	bot: Bot,
	startDate: string,
	endDate: string,
	shareLink: string,
	customButton: any
) => {
	try {
		// Download the image with proper headers
		const imageResponse = await axios.get(event.image_url, {
			responseType: "arraybuffer",
			headers: {
				Accept: "image/*",
			},
		});

		// Create a sharp instance with the downloaded image
		let imageProcess = sharp(Buffer.from(imageResponse.data));

		try {
			// Get image metadata
			const metadata = await imageProcess.metadata();

			// Process the image if width > 1920
			if (metadata.width && metadata.width > 1920) {
				imageProcess = imageProcess.resize(1920, null, {
					fit: "inside",
					withoutEnlargement: true,
				});
			}

			// Convert to JPEG format to ensure compatibility
			const processedBuffer = await imageProcess
				.jpeg({
					quality: 85,
					force: false,
				})
				.toBuffer();

			const imageFile = new InputFile(processedBuffer);
			// Send the processed image
			await bot.api.sendPhoto(parseInt(userId), imageFile, {
				caption: `
📄 <b>${event.title}</b>
👉 <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}

🗓 Ends at: ${endDate}

🔗 Link: ${shareLink}
`,
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [[customButton]],
				},
			});
		} catch (sharpError) {
			console.error("Sharp processing error:", sharpError);
			throw new Error("Image processing failed");
		}
	} catch (error) {
		console.error("Image processing/sending error:", error);

		// Fall back to sending the original URL if processing fails
		await bot.api.sendPhoto(parseInt(userId), event.image_url, {
			caption: `
📄 <b>${event.title}</b>
👉 <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}

🗓 Ends at: ${endDate}

🔗 Link: ${shareLink}
`,
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [[customButton]],
			},
		});
	}
};

function parseTimezone(timeZone) {
	// Check if the timezone is a standard IANA timezone or "UTC"
	try {
		Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
		return timeZone; // Valid IANA timezone or "UTC"
	} catch (e) {
		// If invalid, continue to check for GMT offset
	}

	// Check for "GMT+X" or "GMT-X" format
	const gmtOffsetMatch = timeZone.match(/^GMT([+-]\d{1,2})$/);
	if (gmtOffsetMatch) {
		// Parse the offset hours
		const offsetHours = parseInt(gmtOffsetMatch[1], 10);
		return { offsetHours, label: timeZone }; // Return the offset and label for display
	}

	throw new Error("Invalid timezone format");
}

function formatDateInTimezone(timestamp, timeZone) {
	const parsedTimeZone = parseTimezone(timeZone);
	const date = new Date(timestamp * 1000);
	let formattedDate;

	if (typeof parsedTimeZone === "string") {
		// IANA timezone or UTC
		formattedDate = date.toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: parsedTimeZone,
		});
		return `${formattedDate} (${parsedTimeZone})`;
	} else if (
		typeof parsedTimeZone === "object" &&
		parsedTimeZone.offsetHours !== undefined
	) {
		// GMT offset (e.g., GMT+5 or GMT-3)
		const offsetMillis = parsedTimeZone.offsetHours * 60 * 60 * 1000;
		const adjustedDate = new Date(date.getTime() + offsetMillis);
		formattedDate = adjustedDate.toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${formattedDate} (${parsedTimeZone.label})`;
	}
	throw new Error("Invalid timezone format");
}

export const handleShareEvent = async (
	req: Request & {
		bot: Bot;
	},
	res: Response
) => {
	const { id, user_id, url, share_link, custom_button } = req.body;

	if (
		typeof id === "string" &&
		typeof user_id === "string" &&
		typeof url === "string" &&
		typeof share_link === "string"
	) {
		try {
			const event = await getEvent(id);

			const startDateInSeconds = Number(event.start_date);
			const endDateInSeconds = Number(event.end_date);

			// Specify your desired timezone here (e.g., "GMT+5" or "America/New_York")
			const timeZone = event.timezone;

			if (isNaN(startDateInSeconds) || isNaN(endDateInSeconds)) {
				throw new Error("Invalid date values.");
			}

			// Format startDate and endDate with timezone
			const startDate = formatDateInTimezone(startDateInSeconds, timeZone);
			const endDate = formatDateInTimezone(endDateInSeconds, timeZone);

			const defaultButton = { text: "Buy Ticket", web_app: { url } };
			const customButton = custom_button || defaultButton;

			// Try to process and send the image
			try {
				await processAndSendImage(
					event,
					user_id,
					req.bot,
					startDate,
					endDate,
					share_link,
					customButton
				);
			} catch (error) {
				console.error("Final fallback - using default image");
				// Final fallback - use default image
				await req.bot.api.sendPhoto(
					parseInt(user_id),
					"https://onton.live/template-images/default.webp",
					{
						caption: `
📄 <b>${event.title}</b>
👉 <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}

🗓 Ends at: ${endDate}

🔗 Link: ${share_link}
`,
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [[customButton]],
						},
					}
				);
			}

			res.json(event);
		} catch (error) {
			console.log(error);
			res.status(404).json({ message: "Event not found" });
		}
	} else {
		res.status(400).json({ message: "Invalid query id" });
	}
};

export const handlePhotoMessage = async (
	req: Request & {
		bot: Bot;
	},
	res: Response
) => {
	const { id, user_id, message } = req.body;

	if (
		typeof id === "string" &&
		typeof user_id === "string" &&
		typeof message === "string"
	) {
		try {
			console.log("<----------------------> handlePhotoMessage , ", id , user_id , message)
			const event = await getEvent(id);
			try {
				await req.bot.api.sendPhoto(parseInt(user_id), event.image_url, {
					caption: message,
					parse_mode: "HTML",
				});
			} catch (error) {}

			res.json(event);
		} catch (error) {
			console.log("error_handlePhotoMessage", error);
			res.status(404).json({ message: "Event not found" });
		}
	} else {
		res.status(400).json({ message: "Invalid query id" });
	}
};

interface SendRewardLinkBody {
	chat_id: number;
	link: string;
	custom_message: string;
}

/**
 * Sends a message to a Telegram chat.
 *
 * @param {Request & { bot: Bot }} req - The request object.
 * @param {Response} res - The response object.
 * @return {Promise<Response>} The response object.
 */
export async function sendMessage(
	req: Request & { bot: Bot },
	res: Response,
	tryCount?: number
): Promise<Response> {
	try {
		// Destructure the request body
		const { chat_id, link, custom_message }: SendRewardLinkBody = req.body;

		// Input validation
		if (!chat_id || typeof Number(chat_id) !== "number") {
			// Return an error response if chat_id is invalid or missing
			return res.status(400).json({ error: "Invalid or missing chat_id" });
		}
		if (link && (typeof link !== "string" || !link?.startsWith("http"))) {
			// Return an error response if link is invalid
			return res.status(400).json({ error: "Invalid link" });
		}
		if (!custom_message || typeof custom_message !== "string") {
			// Return an error response if custom_message is missing or invalid
			return res.status(400).json({ error: "Invalid custom_message" });
		}

		// Create the reply_markup object if link is provided
		const reply_markup = link
			? {
					inline_keyboard: [
						[
							{
								text: "Claim Reward",
								url: link,
							},
						],
					],
			  }
			: undefined;

		// Send the message to the chat
		await req.bot.api.sendMessage(chat_id, custom_message.trim(), {
			reply_markup,
			parse_mode: "HTML",
		});

		// Return a success response
		return res.status(200).json({
			success: true,
			message: "Message sent successfully",
		});
	} catch (error) {
		if (
			error instanceof GrammyError &&
			error.error_code === 429 &&
			tryCount < 10
		) {
			console.error("BOT_ERROR: 429", error);

			// wait 1000
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await sendMessage(req, res, tryCount ? tryCount + 1 : 1);
		}

		// Differentiate between Telegram API errors and other errors
		if (error.response?.statusCode) {
			// Handle errors from the Telegram API (e.g., invalid chat_id, bot token issues)
			const errorMessage =
				error.response.description ||
				"An error occurred while sending the message.";
			console.error("TELEGRAM_ERROR:", errorMessage);
			return res.status(error.response.statusCode).json({
				success: false,
				error: errorMessage,
			});
		}

		// Handle other unexpected errors
		console.error("Unexpected error sending message:", error);
		return res.status(500).json({
			success: false,
			error: "Unexpected server error. Please try again later.",
		});
	}
}
