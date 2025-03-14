import { ConversationFlavor, conversations, createConversation, type Conversation } from "@grammyjs/conversations"
import { Composer } from "grammy"
import { MyContext } from "src/types/MyContext"
import { getPlay2winFeatured, isUserAdmin, upsertPlay2winFeatured } from "../db/db"

type FeaturedContext = MyContext & ConversationFlavor
type FeaturedConversation = Conversation<FeaturedContext>

export const play2winFeatured = new Composer<FeaturedContext>()

// Set up conversations middleware
play2winFeatured.use(conversations())
play2winFeatured.use(createConversation(play2winFeaturedConvo))

play2winFeatured.command('play2winfeatured', async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from.id.toString())
  if (!isAdmin) {
    return
  }
  // enter the play2win featured conversation
  await ctx.conversation.enter('play2winFeaturedConvo')
})

async function play2winFeaturedConvo(conversation: FeaturedConversation, ctx: FeaturedContext) {
const currentList = await getPlay2winFeatured()

  await ctx.reply(`🎮 Send me the new list of tournament ids

Current List: <code>${currentList || "empty"}</code>
Example: <code>123,456,789</code>

To empty the list send /empty
To cancel send /cancel`, { parse_mode: "HTML" })

  const answer = await conversation.waitFor('message')

  if (answer.message.text === '/cancel') {
    await ctx.reply('❌ Operation canceled')
    return
  }

  if (answer.message.text === '/empty') {
    await upsertPlay2winFeatured("")
    await ctx.reply('✅ List emptied')
    return
  }

  const inputText = answer.message.text.trim()
  const regex = /^(\d+)(,\d+)*$/
  if (!regex.test(inputText)) {
    await ctx.reply('❌ Invalid input. Please send a comma-separated list of tournament ids, e.g. 123,456,789.')
    return
  }

  await upsertPlay2winFeatured(inputText)
  await ctx.reply('✅ Updated the list with the received data')

  return
}
