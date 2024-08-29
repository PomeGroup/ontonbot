export type CheckInState =
    | "needToCheckin"
    | "checkInError"
    | "checkingInLoading"
    | "checkedInSuccess"
    | "alreadyCheckedIn"
    | "NoTicketData"
    | "ticketInProcess";