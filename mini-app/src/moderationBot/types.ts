/** For the "reject custom" flow, store data keyed by prompt message ID */
export interface PendingCustomReply {
  type: "reject" | "notice";
  eventUuid: string;
  modChatId: number;
  modMessageId: number;
  originalCaption: string;
  allowedUserId: number;
}

export const pendingCustomReplyPrompts = new Map<number, PendingCustomReply>();
