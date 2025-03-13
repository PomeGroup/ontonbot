import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations"
import { Composer, Context, GrammyError } from "grammy"
import { MyContext } from "src/types/MyContext"
import { z } from "zod"
import { getEvent, getEventTickets, isUserAdmin } from "../db/db"
import { sleep } from "../utils/utils"

type BroadcastContext = MyContext & ConversationFlavor;
type BroadcastConversation = Conversation<BroadcastContext>;

export const broadcastComposer = new Composer<BroadcastContext>()

broadcastComposer.use(conversations())
broadcastComposer.use(createConversation(broadcastMessageConvo))

broadcastComposer.command('broadcast', async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from.id.toString())
  if (isAdmin) {
    await ctx.conversation.enter('broadcastMessageConvo')
  }
})

async function broadcastMessageConvo(conversation: BroadcastConversation, ctx: BroadcastContext) {
  await ctx.reply('📣 Send the event id to broadcast, (/cancel)')

  const eventIdAnswerMessage = await conversation.waitFor('message')
  const eventResult = z.string().uuid().safeParse(eventIdAnswerMessage.message.text)

  if (eventIdAnswerMessage.message.text === '/cancel') {
    await ctx.reply('❌ Broadcast canceled')
    return await ctx.conversation.exit()
  }

  if (!eventResult.success) {
    await ctx.reply('❌ Invalid event id')
    return await ctx.conversation.exit()
  }

  const event = await getEvent(eventResult.data)

  if (!event) {
    await ctx.reply('❌ Event not found')
    return await ctx.conversation.exit()
  }

  await ctx.reply("Send the message you want to broadcast to users who bought the ticket (/cancel)")
  const messageAnswer = await conversation.waitFor('message')

  if (messageAnswer.message.text === '/cancel') {
    await ctx.reply('❌ Broadcast canceled')
    return await ctx.conversation.exit()
  }

  const tickets = await getEventTickets(eventResult.data)
  await ctx.reply(`
Do you want to broadcast this message:
👇👇👇👇👇

${messageAnswer.message.text}

👆👆👆👆👆

User Count: ${tickets.length} users will receive this message 

<b>Send with "Yes" to confirm the action and "No" or anything else to cancel.</b>
`, { parse_mode: "HTML" })

  const reaction = await conversation.waitFor('message')

  const confirmResult = reaction.message.text === 'Yes'

  if (confirmResult) {
    for (let index = 0; index < tickets.length; index++) {
      const ticket = tickets[index]
      await sendMessage(ticket.user_id, messageAnswer.message.text, ctx)
      if (index % 100 === 0) {
        await sendMessage(ctx.from.id, `ℹ️  ${index} users have received the rewards`, ctx)
      }
      await sleep(50)
    }
    await sendMessage(ctx.from.id, `✅ ${tickets.length} users have received the rewards, Done`, ctx)
  } else {
    await ctx.reply('❌ Broadcast canceled')
    return await ctx.conversation.exit()
  }
}

async function sendMessage(user_id: number | string, msg: string, ctx: Context) {
  try {
    await ctx.api.sendMessage(user_id, msg)
  } catch (error) {
    if (error instanceof GrammyError) {
      if (error.error_code === 429) {
        await sendMessage(user_id, msg, ctx)
        await sleep(100)
      }
    }
  }
}
