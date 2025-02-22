import { Context, SessionFlavor } from "grammy";

export interface SessionData {

  sbtdistStep?: "askEventUUID" | "confirmEventSelection" | "askCsvFile" | "done";
  sbtEventUUID?: string;
  sbtEventTitle?: string;
}

export type MyContext = Context & SessionFlavor<SessionData>;
