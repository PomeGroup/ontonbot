import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { z } from "zod";

type SearchEventsInput = z.infer<typeof searchEventsInputZod>;

type FilterType = NonNullable<SearchEventsInput["filter"]>;
type ParticipationType = FilterType["participationType"];
type SortBy = SearchEventsInput["sortBy"];
export const allParticipationTypes: ParticipationType = ["online", "in_person"];

export default function parseSearchParams(searchParams: URLSearchParams) {
  const participantFromQuery = searchParams.get("participationType")?.split(",").filter(Boolean) || [];
  const participationType =
    participantFromQuery.length > 0 && participantFromQuery.length !== allParticipationTypes.length
      ? (participantFromQuery as ParticipationType)
      : allParticipationTypes;

  const selectedHubsFromParams = searchParams.get("selectedHubs")?.split(",") || [];
  const sortByQ = (searchParams.get("sortBy") as SortBy) || "start_date_desc";
  const term = searchParams.get("query") || "";

  return {
    search: term,
    sortBy: sortByQ,
    filter: {
      participationType,
      society_hub_id: selectedHubsFromParams.map(Number)
    }
  }
}
