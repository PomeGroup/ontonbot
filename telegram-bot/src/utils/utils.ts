import { validateWebAppData } from "@grammyjs/validator"
import * as fs from "fs"
import { Context, InputFile } from "grammy"
import { InlineKeyboardMarkup } from "grammy/types"
import sharp from "sharp"

export const validateMiniAppData = (rawInitData: any): boolean => {
  const initData = new URLSearchParams(rawInitData as string);
  return validateWebAppData(process.env.BOT_TOKEN, initData);
};

export const escapeHtml = (unsafe: string) => unsafe
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");


const editOrSend = async (
  ctx: Context,
  text: string,
  markup?: InlineKeyboardMarkup,
  imagePath: string = __dirname + "/img/Onton-HQ.jpg",
  edit: boolean = true,
) => {
  // @ts-ignore
  let messageId = ctx.update.callback_query?.message?.message_id;

  if (edit) {
    try {
      const photoStream = fs.readFileSync(imagePath);
      const ontonImage = await sharp(photoStream)
        .resize(800, 800)
        .extend(
          {
            top: 15, bottom: 15, left: 15, right: 15, background: {
              r: 255,
              g: 255,
              b: 255,
            },
          }).toBuffer();

      const imageFile = new InputFile(ontonImage);
      await ctx.api.editMessageMedia(
        ctx.chat!.id,
        messageId,
        {

          type: "photo",
          media: imageFile,
          caption: text,
        },
        {
          reply_markup: markup,
        },
      );
    } catch (error) {
      const photoStream = fs.readFileSync(imagePath);
      const ontonImage = await sharp(photoStream)
        .resize(800, 800)
        .extend(
          {
            top: 15, bottom: 15, left: 15, right: 15, background: {
              r: 255,
              g: 255,
              b: 255,
            },
          }).toBuffer();

      const ontonImageFile = new InputFile(ontonImage);
      const sentMessage = await ctx.api.sendPhoto(
        ctx.chat!.id,
        ontonImageFile,
        {
          caption: text,
          reply_markup: markup,
          parse_mode: "HTML",
        },
      );

      messageId = sentMessage.message_id;
    }
  } else {
    const photoStream = fs.readFileSync(imagePath);
    const ontonImage = await sharp(photoStream)
      .resize(800, 800)
      .extend(
        {
          top: 15, bottom: 15, left: 15, right: 15, background: {
            r: 255,
            g: 255,
            b: 255,
          },
        }).toBuffer();


    const ontonImageFile = new InputFile(ontonImage);
    const sentMessage = await ctx.api.sendPhoto(
      ctx.chat!.id,
      ontonImageFile,
      {
        caption: text,
        reply_markup: markup,
        parse_mode: "HTML",
      },
    );

    messageId = sentMessage.message_id;
  }

  return messageId;
};

export { editOrSend }

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function isUrlValid(url: string) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); 
  return !!pattern.test(url);
}
