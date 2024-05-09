import { validateWebAppData } from '@grammyjs/validator';
import * as fs from 'fs';
import { Context, Markup } from 'telegraf';

export const validateMiniAppData = (rawInitData: any): boolean => {
    const initData = new URLSearchParams(rawInitData as string);
    return validateWebAppData(process.env.BOT_TOKEN, initData);
};


const editOrSend = async (
    ctx: Context,
    text: string,
    markup?: any,
    imagePath: string = './img/main.jpeg',
    edit: boolean = true
) => {

    // @ts-ignore
    let messageId = ctx.update.callback_query?.message?.message_id;

    if (edit) {
        try {
            const photoStream = fs.createReadStream(imagePath);

            await ctx.telegram.editMessageMedia(
                ctx.chat!.id,
                messageId,
                undefined,
                {
                    type: "photo",
                    media: { source: photoStream },
                    caption: text,
                },
                {
                    reply_markup: {
                        inline_keyboard: markup,
                    },
                }
            );
        } catch (error) {
            const photoStream = fs.createReadStream(imagePath);
            const sentMessage = await ctx.telegram.sendPhoto(
                ctx.chat!.id,
                { source: photoStream },
                {
                    caption: text,
                    reply_markup: {
                        inline_keyboard: markup,
                    },
                    parse_mode: "HTML",
                }
            );

            messageId = sentMessage.message_id;
        }
    } else {
        const photoStream = fs.createReadStream(imagePath);

        const sentMessage = await ctx.telegram.sendPhoto(
            ctx.chat!.id,
            { source: photoStream },
            {
                caption: text,
                reply_markup: {
                    inline_keyboard: markup,
                },

                parse_mode: "HTML",
            }
        );

        messageId = sentMessage.message_id;
    }

    return messageId;
};

export {
    editOrSend
}