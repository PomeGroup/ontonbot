import { Composer, Context } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { z } from "zod";
import { getEvent, getEventTickets } from "src/db/db";
import { sleep } from "src/utils/utils";

type BroadcastContext = Context & ConversationFlavor;
type BroadcastConversation = Conversation<BroadcastContext>;

export const broadcastComposer = new Composer<BroadcastContext>()

broadcastComposer.use(conversations())
broadcastComposer.use(createConversation(broadcastMessageConvo))

broadcastComposer.command('broadcast', async (ctx) => {
  await ctx.conversation.enter('broadcastMessageConvo')
})

async function broadcastMessageConvo(conversation: BroadcastConversation, ctx: BroadcastContext) {
  await ctx.reply('📣 Send the event id to broadcast')

  const eventIdAnswerMessage = await conversation.waitFor('message')
  const eventResult = z.string().uuid().safeParse(eventIdAnswerMessage.message)

  if (!eventResult.success) {
    await ctx.reply('❌ Invalid event id')
    return await ctx.conversation.exit()
  }

  const event = await getEvent(eventResult.data)

  if (!event) {
    await ctx.reply('❌ Event not found')
    return await ctx.conversation.exit()
  }

  await ctx.reply("Send the message you want to broadcast to users who bought the ticket")
  const messageAnswer = await conversation.waitFor('message')
  const tickets = await getEventTickets(eventResult.data)
  await ctx.reply(`
Do you want to broadcast this message:
👇👇👇👇👇

${messageAnswer.message}

👆👆👆👆👆

User Count: ${tickets.length} users will receive this message 

<b>React with "👍" to confirm the action and "👎" to cancel.</b>
`, { parse_mode: "HTML" })

  const reaction = await conversation.waitForReaction('👍')
  const confirmResult = reaction.hasReaction('👍')

  if (confirmResult) {
    for (let index = 0; index < tickets.length; index++) {
      const ticket = tickets[index];
      await ctx.api.sendMessage(ticket.user_id, messageAnswer.message.text)
      await sleep(100)
    }
  } else {
    await ctx.reply('❌ Broadcast canceled')
    return await ctx.conversation.exit()
  }

}
