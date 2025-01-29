import { InlineKeyboard } from "grammy";

/**
 * Build the main menu (with "Reject (Custom)" added)
 */
export  function tgBotModerationMenu(eventUuid: string) {
  return new InlineKeyboard()
    .text("✅ Approve", `approve_${eventUuid}`)
    .row()
    .text("❌ Duplicate", `rejectDuplicate_${eventUuid}`)
    .text("❌ Inappropriate content", `rejectInappropriate_${eventUuid}`)
    .row()
    .text("❌ Spam or self-promotion", `rejectSpam_${eventUuid}`)
    .text("❌ Incorrect information", `rejectIncorrect_${eventUuid}`)
    .row()
    .text("❌ Missing information", `rejectMissing_${eventUuid}`)
    .text("❌ Safety concerns", `rejectSafety_${eventUuid}`)
    .row()
    .text("❌ Copyright", `rejectCopyright_${eventUuid}`)
    .text("❌ Custom reason", `rejectCustom_${eventUuid}`)
    .row()
    // NEW! Buttons to update event
    .text("🔃 Update Data", `updateEventData_${eventUuid}`)

}

export function parseRejectReason(reason: string): string {
  switch (reason) {
    case "Duplicate":
      return "Duplicate event";
    case "Inappropriate":
      return "Inappropriate content";
    case "Spam":
      return "Spam or self-promotion";
    case "Incorrect":
      return "Incorrect information";
    case "Missing":
      return "Missing required information";
    case "Safety":
      return "Safety concerns";
    case "Copyright":
      return "Copyright infringement";
    default:
      return "No specific reason";
  }
}