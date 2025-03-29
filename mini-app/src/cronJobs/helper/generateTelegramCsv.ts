/**
 *  Generate a single-column CSV of participant telegram IDs
 */
export function generateTelegramCsv(participants: { telegramId: number }[]): Buffer {
  // Each line is the telegram ID as an integer
  const lines = participants.map((p) => String(p.telegramId));
  return Buffer.from(lines.join("\n"), "utf8");
}
