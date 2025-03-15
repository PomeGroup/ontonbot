import { MyContext } from "../types/MyContext";

/**
 * A helper that checks if the message is a new slash command ("/...")
 * If so, returns true, meaning we should skip the current multi-step flow
 */
export function isNewCommand(ctx: MyContext) {
  const entities = ctx.message?.entities;
  if (!entities) return false;
 
  return entities.some((ent) => ent.type === "bot_command");
}