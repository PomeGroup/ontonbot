import { Context } from "telegraf";
import { startKeyboard } from "./markups";
import { editOrSend } from "./utils/utils";
import { TVisitor } from "./utils/types";
import { addVisitor, changeRole, countReferrals } from "./db/db";

const admins = ["samyar_kd", "Mfarimani"]



export const orgHandler = async (ctx: Context) => {
    try {
        if (!admins.includes(ctx.from?.username || '')) {
            await editOrSend(ctx, `You are not authorized to perform this operation.`, startKeyboard());
            return
        }

        // @ts-ignore
        const messageText = ctx.message?.text

        if (messageText && messageText.split(' ').length === 3 && messageText.split(' ')[0] === '/org') {
            const role = messageText.split(' ')[1]
            const username = messageText.split(' ')[2]

            await changeRole(username, role)

            await editOrSend(ctx, `Role for ${username} changed to ${role}.`, startKeyboard());
        }
        else {
            await editOrSend(ctx, `Invalid command.`, startKeyboard());
        }
    }
    catch (error) {
    }
}


const startHandler = async (ctx: Context) => {
    try {
        addVisitor(
            {
                telegram_id: ctx.from!.id.toString(),
                first_name: ctx.from?.first_name || '',
                last_name: ctx.from?.last_name || '',
                username: ctx.from!.username || '',
                created_at: new Date().toISOString()
            } as TVisitor
        )

        // @ts-ignore
        const messageText = ctx.message?.text
        let path = undefined

        if (messageText && messageText.split(' ').length === 2 && messageText.split(' ')[0] === '/start') {
            path = messageText.split(' ')[1]
        }

        await editOrSend(ctx, `<b>Welcome to ONTON - TON Society Event Bot</b>
    
Please click the link below to discover current future events.`, startKeyboard(), './img/main.jpeg');
    }
    catch (error) {
        console.log(error)
    }
}



export {
    startHandler
};
