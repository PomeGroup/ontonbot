import { Composer, Context } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

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
  const { message } = await conversation.waitFor('message')
  await ctx.reply(message.text)
}
