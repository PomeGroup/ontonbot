import { Context, SessionFlavor } from "grammy";

export interface SessionData {

  sbtdistStep?: "askEventUUID" | "confirmEventSelection" | "chooseDistributionMethod" | "handleAllApproved" | "askCsvFile" | "done";
  sbtEventUUID?: string;
  sbtEventTitle?: string;
}

export type MyContext = Context & SessionFlavor<SessionData>;
