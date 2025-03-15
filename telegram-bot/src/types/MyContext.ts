import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  /* ------------------ SBT Distribution Flow ------------------ */
  sbtdistStep?:
    | "askEventUUID"
    | "confirmEventSelection"
    | "chooseDistributionMethod"
    | "askCsvFile"
    | "handleAllApproved"
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
  /* ------------------ Tournament Flow ------------------ */
  tournamentStep?:
    | "pickGame"
    | "askTournamentId"
    | "askInviteMessage"
    | "confirmInsert"
    | "check"
    | "confirmCreate"
    | "askTournamentPhoto"
    | "askTournamentLink"
    | "done"
    | undefined;

  tournamentData?: {
    gameId?: string;
    tournamentId?: string;
    photoFileId?: string;
    existingTournament?: any;  // to store check result if needed
    createConfirmed?: boolean;
    tournamentLink?: string;
  };
  /* ------------------ Play2Win Featured Flow ------------------ */
  play2winStep?: "askList" | "done";
  /* ------------------ Broadcast Flow ------------------ */
  broadcastStep?: "askEventId" | "askMessage" | "confirm" | "done";
  broadcastEventId?: string;
  broadcastMessage?: string;

}

export type MyContext = Context & SessionFlavor<SessionData>;
