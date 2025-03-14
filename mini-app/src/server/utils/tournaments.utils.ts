export const tournamentsListSortOptions = ["prize", "entryFee", "timeRemaining"] as const;

export function formatSortTournamentSelectOption(option: SortOptions): string {
  switch (option) {
    case "prize":
      return "Prize";
    case "entryFee":
      return "Entry fee";
    case "timeRemaining":
      return "Time remaining";
    default:
      return option;
  }
}

export type SortOptions = (typeof tournamentsListSortOptions)[number];
