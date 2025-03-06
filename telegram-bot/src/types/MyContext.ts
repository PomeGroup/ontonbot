import { Context, SessionFlavor } from "grammy";

export interface SessionData {

  sbtdistStep?: "askEventUUID" | "confirmEventSelection" | "chooseDistributionMethod" | "handleAllApproved" | "askCsvFile" | "done";
  sbtEventUUID?: string;
  sbtEventTitle?: string;
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
    | undefined; // or add more steps as needed

  affiliateLinkType?: "EVENT" | "HOME";
  affiliateEventUUID?: string;
  affiliateEventId?: number;
  affiliateEventTitle?: string;
  affiliateLinkCount?: number;
  affiliateLinkTitle?: string;
  existingLinksCount?: number;
}

export type MyContext = Context & SessionFlavor<SessionData>;
