import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  /* ------------------ SBT Distribution Flow ------------------ */
  sbtdistStep?:
    | "askEventUUID"
    | "confirmEventSelection"
    | "chooseDistributionMethod"
    | "handleAllApproved"
    | "askCsvFile"
    | "done";
  sbtEventUUID?: string;
  sbtEventTitle?: string;

  /* ------------------ Affiliate Flow ------------------ */
  affiliateStep?:
    | "chooseType"
    | "reporting"
    | "askEventUUID"
    | "pickingEvent"
    | "confirmEvent"
    | "chooseAction"
    | "askCountOfLinks"
    | "askTitleOfLinks"
    | "generatingLinks"
    | undefined;
  affiliateLinkType?: "EVENT" | "HOME";
  affiliateEventUUID?: string;
  affiliateEventId?: number;
  affiliateEventTitle?: string;
  affiliateLinkCount?: number;
  affiliateLinkTitle?: string;
  existingLinksCount?: number;

  /* ------------------ Group Linking Flow ------------------ */
  groupStep?:
    | "selectEvent"
    | "confirmEvent"
    | "askGroupId"
    | "confirmGroup"
    | undefined;
  groupEventId?: number;
  groupEventUUID?: string;
  groupEventTitle?: string;
  pendingGroupId?: number;
}

export type MyContext = Context & SessionFlavor<SessionData>;
