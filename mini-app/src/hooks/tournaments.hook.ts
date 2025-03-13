import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";

/**
 * Hook used for retrieving tournament details based on the "play-id" URL parameter.
 *
 * @remarks
 * This hook should only be used inside the tournament page. It extracts the tournament ID from the URL parameters and retrieves the corresponding tournament data
 * using a tRPC query. The query is enabled if the "play-id" parameter is a valid number and uses a stale time of 5 minutes.
 *
 * @returns An object containing the tournament query state and data.
 */
export const usePageTournament = () => {
  const params = useParams<{
    "play-id": string;
  }>();

  if (!params["play-id"]) {
    throw new Error("This hook should only be used inside the tournament page");
  }

  const id = Number(params["play-id"]);
  const isEnabled = !isNaN(id);
  const tournament = trpc.tournaments.getTournamentById.useQuery(
    { id },
    {
      enabled: isEnabled,
      staleTime: 1000 * 60 * 5,
    }
  );

  return tournament;
};
