import { Context } from "grammy";
import { changeRole, isUserAdmin } from "./db/db";
import { editOrSend } from "./utils/utils";
import { startKeyboard } from "./markups";
import { sendTopicMessage } from "./utils/logs-bot";
import { hideCmd } from "./db/cmd.db";

/* -------------------------------------------------------------------------- */
/*                                 ORG Handler                                */
/* -------------------------------------------------------------------------- */
/* ---------------------------------- /org ---------------------------------- */
/* -------------------------------------------------------------------------- */
export const orgHandler = async (ctx: Context, next: () => Promise<void>) => {
	// get user from database
	const { isAdmin } = await isUserAdmin(ctx.from.id.toString());

	if (!isAdmin) {
		return await ctx.reply(`You are not authorized to perform this operation.`);
	}

	try {
		// @ts-ignore
		const messageText = ctx.message?.text;

		if (
			messageText &&
			messageText.split(" ").length === 3 &&
			messageText.split(" ")[0] === "/org"
		) {
			const role = messageText.split(" ")[1];
			const username = messageText.split(" ")[2];

			// role should be user, admin, organizer otherwise throw a nice error

			if (!["user", "admin", "organizer"].includes(role)) {
				await editOrSend(
					ctx,
					`Invalid role. Must be one of: user, admin, organizer.`,
					startKeyboard()
				);

				next();
				return;
			}

			await changeRole(role, username)
				.then(async (response) => {
					const changeMessage = `Role for @${response.username} with userId : ${response.user_id} changed to ${role}.`;

					await sendTopicMessage(
						"organizers_topic",
						changeMessage +
							`\n` +
							`Total Organizers : ${response.total_organizers_count}`
					);

					await editOrSend(ctx, changeMessage, startKeyboard());
				})
				.catch(async (error) => {
					if (error instanceof Error) {
						if (error.message === "user_not_found") {
							await editOrSend(
								ctx,
								`User with username: ${username} does not exist.`,
								startKeyboard()
							);
						}

						if (error.message === "nothing_to_update") {
							await editOrSend(
								ctx,
								`Nothing to update user already is an ${role}.`,
								startKeyboard()
							);
						}
					}
				});
		} else {
			await editOrSend(ctx, `Invalid command.`, startKeyboard());
		}
	} catch (error) {}
};

/* -------------------------------------------------------------------------- */
/*                               Command Handler                              */
/* -------------------------------------------------------------------------- */
export const cmdHandler = async (ctx: Context, next: () => Promise<void>) => {
	// get user from database
	const { isAdmin } = await isUserAdmin(ctx.from.id.toString());

	if (!isAdmin) {
		return await ctx.reply(`You are not authorized to perform this operation.`);
	}

	try {
		// @ts-ignore
		const messageText = ctx.message?.text;

		if (messageText && messageText.split(" ")[0] === "/cmd") {
			const payload = messageText.split(" ");

			const command = payload[1];
			if (
				command.toLowerCase() === "hide" ||
				command.toLowerCase() === "unhide"
			) {
				const hide = command.toLowerCase() === "hide";
				const event_uuid = payload[2];

				await hideCmd(event_uuid, hide)
					.then(async () => {
						const message = `Event ${event_uuid} Hidden : ${hide}`;

						await sendTopicMessage("organizers_topic", message);

						await editOrSend(ctx, message, startKeyboard());
					})
					.catch(async (error) => {
						await editOrSend(ctx, `went wrong ${error}`, startKeyboard());
					});
			}
		} else {
			await editOrSend(ctx, `Invalid command.`, startKeyboard());
		}
	} catch (error) {}
};

/* -------------------------------------------------------------------------- */
/*                                START COMMAND                               */
/* -------------------------------------------------------------------------- */
export const startHandler = async (ctx: Context) => {
	try {
		const messageText = ctx.message?.text;
		let path = undefined;

		if (
			messageText &&
			messageText.split(" ").length === 2 &&
			messageText.split(" ")[0] === "/start"
		) {
			path = messageText.split(" ")[1];
		}

		await editOrSend(
			ctx,
			`<b>Please click the link below to ‘Discover the App’</b>`,
			startKeyboard(),
			undefined,
			false
		);
	} catch (error) {
		console.log(error);
	}
};
