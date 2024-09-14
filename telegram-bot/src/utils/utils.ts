import { validateWebAppData } from "@grammyjs/validator"
import * as fs from "fs"
import sharp from "sharp"
import { Context } from "telegraf"

export const validateMiniAppData = (rawInitData: any): boolean => {
  const initData = new URLSearchParams(rawInitData as string);
  return validateWebAppData(process.env.BOT_TOKEN, initData);
};

const editOrSend = async (
  ctx: Context,
  text: string,
  markup?: any,
  imagePath: string = __dirname + "/img/onton-logo.png",
  edit: boolean = true
) => {
  // @ts-ignore
  let messageId = ctx.update.callback_query?.message?.message_id;

  if (edit) {
    try {
      const photoStream = fs.readFileSync(imagePath)
      const ontonImage = await sharp(photoStream)
        .resize(300,300)
        .extend(
          { top: 15, bottom: 15, left: 15, right: 15, background: {
            r: 255,
            g: 255,
            b: 255
          }
        }).toBuffer();

      await ctx.telegram.editMessageMedia(
        ctx.chat!.id,
        messageId,
        undefined,
        {
          type: "photo",
          media: { source: ontonImage},
          caption: text,
        },
        {
          reply_markup: {
            inline_keyboard: markup,
          },
        }
      );
    } catch (error) {
      const photoStream = fs.readFileSync(imagePath)
      const ontonImage = await sharp(photoStream)
        .resize(300,300)
        .extend(
          { top: 15, bottom: 15, left: 15, right: 15, background: {
            r: 255,
            g: 255,
            b: 255
          }
        }).toBuffer();

      const sentMessage = await ctx.telegram.sendPhoto(
        ctx.chat!.id,
        { source: ontonImage },
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
    const photoStream = fs.readFileSync(imagePath)
    const ontonImage = await sharp(photoStream)
      .resize(300,300)
      .extend(
        { top: 15, bottom: 15, left: 15, right: 15, background: {
          r: 255,
          g: 255,
          b: 255
        }
      }).toBuffer();

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat!.id,
      { source: ontonImage },
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

export { editOrSend }

