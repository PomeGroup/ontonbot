export function renderModerationFlowup(username: string | number): string {
  return `
<b>Event Updated Again</b>
by @${username}

Please re-check this event (needs moderation).
`.trim();
}
