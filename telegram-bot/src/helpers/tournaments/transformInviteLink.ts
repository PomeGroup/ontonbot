/**
 * Given a Telegram invite link like:
 *   https://t.me/sweet_rush_bot?start=code-fsghgoji__league-8n3i08s8
 * produce a new link:
 *   https://t.me/sweet_rush_bot/game?startapp=league-8n3i08s8
 *
 * or generally:
 *   {base}/game?startapp={the portion after "league-"}
 */
export function transformInviteLink(originalLink: string): string {
  // 1) Split at the first "?"
  const [base, query] = originalLink.split("?", 2);
  if (!query) {
    // If no query, just return original
    return originalLink;
  }

  // 2) parse the "start=" param from the query
  //    e.g. "start=code-fsghgoji__league-8n3i08s8"
  //    We'll find the portion after "start="
  let startParam: string | null = null;
  const startMatch = query.match(/start=([^&]+)/);
  if (startMatch) {
    startParam = decodeURIComponent(startMatch[1]);
    // e.g. "code-fsghgoji__league-8n3i08s8"
  }

  if (!startParam) {
    // If no start param, just return the base
    return base;
  }

  // 3) Extract the "league-..." portion (or the last dash if you prefer).
  //    Option A: match /league-[^]+/
  let finalPart: string | null = null;
  // Attempt to find "league-"
  const leagueMatch = startParam.match(/league-[^]+/);
  if (leagueMatch) {
    finalPart = leagueMatch[0]; // e.g. "league-8n3i08s8"
  } else {
    // If there's no "league-", fallback to last dash
    const dashIndex = startParam.lastIndexOf("-");
    if (dashIndex !== -1) {
      finalPart = startParam.slice(dashIndex + 1);
      // e.g. "8n3i08s8"
      // If you want to keep "league-", do something like:
      // finalPart = "league-" + startParam.slice(dashIndex + 1);
    }
  }

  if (!finalPart) {
    // If we can't parse, fallback
    return base;
  }

  // 4) Build the new link => {base}/game?startapp={finalPart}
  //    e.g. "https://t.me/sweet_rush_bot/game?startapp=league-8n3i08s8"
  return `${base}/game?startapp=${encodeURIComponent(finalPart)}`;
}
