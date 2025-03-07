// src/handlers/affiliateHandler.ts
import { MyContext } from "../types/MyContext";
import { isUserAdmin } from "../db/db"; // Or your helper to check roles

export async function affiliateHandler(ctx: MyContext) {
  // 1) (Optional) Check if user is admin.
  //    If you also want to allow event owners or organizers,
  //    you can do a similar check here OR skip it and handle
  //    the ownership check inside your composer (like we do for the event UUID).
  const userIdString = ctx.from?.id?.toString() || "";
  const { isAdmin } = await isUserAdmin(userIdString);
  if (!isAdmin) {
    // For a more flexible approach, you could also do a quick check
    // if the user has the 'organizer' role or not. For example:
    // const user = await getUser(userIdString);
    // if (user && (user.role === 'admin' || user.role === 'organizer')) { ... }

    return ctx.reply("You are not authorized to run this command.");
  }

  // 2) Reset the affiliate session flow
  ctx.session.affiliateStep = "chooseAction";
  ctx.session.affiliateLinkType = undefined;
  ctx.session.affiliateEventUUID = undefined;
  ctx.session.affiliateEventId = undefined;
  ctx.session.affiliateLinkCount = undefined;
  ctx.session.affiliateLinkTitle = undefined;
  return ctx.reply("You are not authorized to run this command.");
  // 3) Prompt the user

}
