import { NextRequest } from "next/server";
import { apiKeyAuthentication, getAuthenticatedUser } from "@/server/auth";
import { getTournamentDetails } from "@/lib/elympicsApi";
import { gamesDB } from "@/server/db/games.db";
import { tournamentsDB } from "@/server/db/tournaments.db";
import { logger } from "@/server/utils/logger";

// Example environment variables used for Elympics API calls
const ELYMPICS_PUBLISHER_KEY = process.env.ELYMPICS_PUBLISHER_KEY || "onton-key-79bb98e150253efbcffffc9c";
const ELYMPICS_BEARER_TOKEN =
  process.env.ELYMPICS_BEARER_TOKEN ||
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNTAzYmFjZi1iODZlLTQ3M2QtOGYxMC1jYTY2NDA4NTZhYWEiLCJhdXRoLXR5cGUiOiJjbGllbnQtc2VjcmV0IiwibmJmIjoxNzQxNjE0ODE2LCJleHAiOjE3NDE3MDEyMTYsImlhdCI6MTc0MTYxNDgxNn0.EvYNon9G0QiY28VgQgef_6Bg_ENnOEmpQlmOchgUFrSLtAA_RQZUv1SKcOUDOXbJGFVTQz7TPYb3pAg6JIv2ORqzfVPLJVVOHKsziU1BnO5E5lo9z128rgP0y-056OQSDJD9EdFK5DpBh6O1tqyStc6WJwNX5wAgwV937h--9zjMfM_YSrK5Zz_fSqP-NXCwQCV8G6NLvWmDb4SnYmxRzUdXwvskesoI6hhAOyDH1GyzpFMC0JsY3B8IMjZM686e8VjCTsbnz-TnOX04CPIcXx-1-jwIdIHMqhInNh5u5fDrpphNd_2X2rACRNKgjz7ltcH7f_VlYe1j3rXMMw_bCxE4ISFKM_GyjpNMp_mufDpvUhRSCOiAvKa2uZsdHq1zxJd70oqtCvp6mfWAfgfAg4p-Qz99eTwEjaYShEINMtW-7PfwFctkb_xxvyTj7nCnQhVmZjgpQIuWJOFfPEtUh2zl11hpVpuGWzL4JDekae9YsXRzBWVmE01KxOHKexKgCYEaOGKnPEXasup7KKy4PEtuXuksLcnhttw3M0euKc9t43wh25jYO1WFhrJA-u0AKFiRejuj02GR5b5_htR5jgCnrnlAeFi53926irggyVwMqHva0fNznfrSETMP7xEo2JtWRT10sL35EdmQ8CGTcjsrT8_li4ipS4LPCq187RE";

interface IParams {
  mode: string; // "check" or "create"
  gameId: string; // e.g. "f50fcb6e-591b-4345-8233-f97db10c40fb" (Elympics UUID)
  tournamentId: string; // e.g. "o17yuwmr"
}

/**
 * GET /api/tournament/[mode]/[gameId]/[tournamentId]
 *
 * mode = "check"   => fetch Elympics data & return
 * mode = "create" => fetch Elympics data, compare with route's gameId, insert in DB
 */
export async function GET(req: NextRequest, { params }: { params: IParams }) {
  // 1) Auth checks

  const apiKeyError = apiKeyAuthentication(req);
  if (apiKeyError) {
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  }

  const { mode, gameId, tournamentId } = params;
  if (!gameId || !tournamentId) {
    return new Response(JSON.stringify({ message: "missing_game_or_tournament_id" }), {
      status: 400,
    });
  }

  // 2) Fetch Elympics tournament details
  let details;
  try {
    details = await getTournamentDetails(ELYMPICS_PUBLISHER_KEY, ELYMPICS_BEARER_TOKEN, tournamentId);
    if (!details) {
      return new Response(JSON.stringify({ message: "tournament_not_found_in_elympics" }), {
        status: 404,
      });
    }
  } catch (error) {
    logger.error("Error fetching Elympics tournament:", error);
    return new Response(JSON.stringify({ message: "elympics_fetch_error" }), { status: 500 });
  }

  // 3) Confirm the Elympics data's GameId matches our route param 'gameId'
  if (details.GameId !== gameId) {
    return new Response(
      JSON.stringify({
        message: "mismatched_game_id",
        expected: gameId,
        actual: details.GameId,
      }),
      { status: 400 }
    );
  }

  // 4) If mode is just "check", return the data
  if (mode === "check") {
    return new Response(JSON.stringify({ data: details }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // 5) If mode === "create", insert game + tournament in DB
  if (mode === "create") {
    try {
      // Insert game if not already exist (this snippet always inserts new row—real code might check first)
      const gameRow = await gamesDB.addGame({
        hostGameId: gameId,
        name: details.Name, // optional
        imageUrl: "", // optional
        rawGameJson: details as any,
      });

      // Insert tournament
      const tournamentRow = await tournamentsDB.addTournament({
        hostTournamentId: details.Id, // e.g. "o17yuwmr"
        hostTournamentGuid: details.TournamentGuid, // e.g. "4d28ea98-a01c-41ca-a2b2-dc7cffe6b1ef"
        gameId: gameRow?.id ?? 1, // references games.id
        createdByUserId: 123, // e.g. from your user or session
        owner: null, // optional
        name: details.Name,
        imageUrl: "",
        state: details.State === "Active" ? "Active" : "Concluded", // example
        createDate: details.CreateDate ? new Date(details.CreateDate) : null,
        startDate: details.StartDate ? new Date(details.StartDate) : null,
        endDate: details.EndDate ? new Date(details.EndDate) : null,
        playersCount: details.PlayersCount,
        entryFee: details.EntryFee,
        tonEntryType: details.TonDetails?.EntryType === "Tickets" ? "Tickets" : "Pass",
        tonTournamentAddress: details.TonDetails?.TournamentAddress,
        prizePoolStatus: "Undefined",
        prizeType: details.PrizeType === "Coin" ? "Coin" : "None",
        currentPrizePool: details.CurrentPrizePool,
        activityId: null,
        tsRewardImage: null,
        tsRewardVideo: null,
        hidden: false,
        rawHostJson: details as any,
      });

      if (!tournamentRow) {
        return new Response(JSON.stringify({ message: "failed_to_insert_tournament" }), {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ insertedTournament: tournamentRow }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      logger.error("Error creating tournament in DB:", err);
      return new Response(JSON.stringify({ message: "db_insert_error" }), {
        status: 500,
      });
    }
  }

  // If mode not recognized
  return new Response(JSON.stringify({ message: "invalid_mode" }), { status: 400 });
}
