import { NextRequest } from "next/server";
import { apiKeyAuthentication, getAuthenticatedUser } from "@/server/auth";
import { getTournamentDetails } from "@/lib/elympicsApi";
import { db } from "@/db/db"; // Drizzle main instance for transactions
import { gamesDB } from "@/server/db/games.db";
import { tournamentsDB } from "@/server/db/tournaments.db";
import { logger } from "@/server/utils/logger";
import sizeOf from "image-size";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import axios from "axios";
import FormData from "form-data";
import { File as FormidableFile } from "formidable";
import jwt from "jsonwebtoken";
import fs from "fs";
import { parseMultipartForm } from "@/lib/parseMultipartForm";

/** Env config / constants **/
const ELYMPICS_PUBLISHER_KEY = process.env.ELYMPICS_PUBLISHER_KEY || "";
const ELYMPICS_BEARER_TOKEN = process.env.ELYMPICS_BEARER_TOKEN || "";
const UPLOAD_FILE_ENDPOINT = process.env.UPLOAD_FILE_ENDPOINT || "http://localhost:3000/api/files/upload";
const UPLOAD_TOKEN = process.env.ONTON_API_SECRET || "fallback-secret";

// Ensure Node.js runtime, not Edge
export const config = {
  runtime: "nodejs",
};

/**
 * POST /api/tournament/[mode]/[gameId]/[tournamentId]/[userId]
 *
 * Steps:
 *  - If mode === "check":
 *      -> fetch from Elympics, validate gameId, return data
 *  - If mode === "create":
 *      -> parse + validate file, upload to Minio
 *      -> fetch Elympics, validate gameId
 *      -> transaction: insert game (with userId), insert tournament (with userId), return new row
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { mode: string; gameId: string; tournamentId: string; userId: string } }
) {
  // 1) Auth checks
  const [, userError] = getAuthenticatedUser();
  const apiKeyError = apiKeyAuthentication(req);
  if (userError && apiKeyError) {
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  }

  const { mode, gameId, tournamentId, userId } = params;
  if (!mode || !gameId || !tournamentId) {
    return new Response(JSON.stringify({ message: "missing_required_params" }), { status: 400 });
  }

  // 2) If mode === 'check', just fetch & return data from Elympics
  if (mode === "check") {
    try {
      const details = await getTournamentDetails(ELYMPICS_PUBLISHER_KEY, ELYMPICS_BEARER_TOKEN, tournamentId);
      if (!details) {
        return new Response(JSON.stringify({ message: "tournament_not_found_in_elympics" }), { status: 404 });
      }
      if (details.GameId !== gameId) {
        return new Response(
          JSON.stringify({
            message: "mismatched_game_id",
            expected: gameId,
            actual: details.GameId,
          }),
          {
            status: 400,
          }
        );
      }
      // Return the Elympics data
      return new Response(JSON.stringify({ data: details }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      logger.error("Error fetching Elympics tournament (check):", error);
      return new Response(JSON.stringify({ message: "elympics_fetch_error" }), { status: 500 });
    }
  }

  // 3) If mode === 'create', parse the file, upload, etc.
  if (mode === "create") {
    // a) Parse the multipart form => get the file
    let fileBuffer: Buffer | null = null;
    let mimeType: string | null = null;

    try {
      const { files } = await parseMultipartForm(req);
      if (!files || !files.file) {
        return new Response(JSON.stringify({ message: "file_required" }), { status: 400 });
      }

      const fileData = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = (fileData as FormidableFile).filepath;
      fileBuffer = fs.readFileSync(filePath);
      mimeType = (fileData as FormidableFile).mimetype || "image/png";
    } catch (err) {
      logger.error("Error parsing multipart form:", err);
      return new Response(JSON.stringify({ message: "parse_form_error" }), { status: 400 });
    }

    if (!fileBuffer) {
      return new Response(JSON.stringify({ message: "file_buffer_empty" }), { status: 400 });
    }

    // b) Validate image size/dimensions
    try {
      const dimensions = sizeOf(fileBuffer);
      if (!dimensions.width || !dimensions.height) {
        return new Response(JSON.stringify({ message: "invalid_image_dimensions" }), { status: 400 });
      }
      if (dimensions.width < 400 || dimensions.height < 400) {
        return new Response(JSON.stringify({ message: "Image too small. Min 400x400." }), { status: 400 });
      }
    } catch (err) {
      logger.error("Error reading image dimensions:", err);
      return new Response(JSON.stringify({ message: "failed_image_dimensions" }), { status: 400 });
    }

    // c) ClamAV scanning
    let isClean = false;
    try {
      isClean = await scanFileWithClamAV(fileBuffer);
    } catch (err) {
      logger.error("Error scanning file with ClamAV:", err);
      return new Response(JSON.stringify({ message: "clamav_scan_error" }), { status: 400 });
    }
    if (!isClean) {
      return new Response(JSON.stringify({ message: "malicious_file_detected" }), { status: 400 });
    }

    // d) Upload image to your file endpoint
    let uploadedImageUrl = "";
    try {
      const formData = new FormData();
      formData.append("image", fileBuffer, {
        filename: "tournament_image.png",
        contentType: mimeType,
      });
      formData.append("subfolder", "event");

      const token = jwt.sign({ scope: "uploadImage" }, UPLOAD_TOKEN, { expiresIn: "1h" });
      const res = await axios.post(UPLOAD_FILE_ENDPOINT, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.data?.imageUrl) {
        return new Response(JSON.stringify({ message: "upload_failed_no_imageUrl" }), { status: 500 });
      }
      uploadedImageUrl = res.data.imageUrl;
    } catch (err) {
      logger.error("Error uploading image to /files/upload:", err);
      return new Response(JSON.stringify({ message: "file_upload_error" }), { status: 500 });
    }

    // e) Fetch Elympics data => validate
    let details;
    try {
      details = await getTournamentDetails(ELYMPICS_PUBLISHER_KEY, ELYMPICS_BEARER_TOKEN, tournamentId);
      if (!details) {
        return new Response(JSON.stringify({ message: "tournament_not_found_in_elympics" }), { status: 404 });
      }
      if (details.GameId !== gameId) {
        return new Response(
          JSON.stringify({
            message: "mismatched_game_id",
            expected: gameId,
            actual: details.GameId,
          }),
          {
            status: 400,
          }
        );
      }
    } catch (error) {
      logger.error("Error fetching Elympics tournament (create):", error);
      return new Response(JSON.stringify({ message: "elympics_fetch_error" }), { status: 500 });
    }

    // f) Insert into local DB with a transaction (game + tournament)
    try {
      const numericUserId = parseInt(userId, 10) || 0;

      const result = await db.transaction(async (trx) => {
        // Insert game
        const gameRow = await gamesDB.insertGameTx(trx, {
          hostGameId: gameId,
          userId: numericUserId, // newly added user_id field in 'games'
          name: details.Name ?? "",
          imageUrl: "",
          rawGameJson: details as any,
        });

        // Insert tournament (store 'uploadedImageUrl')
        const insertedTournament = await tournamentsDB.insertTournamentTx(trx, {
          hostTournamentId: details.Id,
          hostTournamentGuid: details.TournamentGuid,
          gameId: gameRow?.id ?? 1,
          createdByUserId: numericUserId,
          owner: numericUserId,
          name: details.Name,
          imageUrl: uploadedImageUrl,
          state: details.State === "Active" ? "Active" : "Concluded",
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

        if (!insertedTournament) {
          throw new Error("failed_to_insert_tournament");
        }

        return { insertedTournament };
      });

      return new Response(JSON.stringify({ message: "success", tournament: result.insertedTournament }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      logger.error("Error creating game/tournament in DB (transaction):", err);
      return new Response(JSON.stringify({ message: "db_insert_error" }), { status: 500 });
    }
  }

  // If mode is neither "check" nor "create", return an error
  return new Response(JSON.stringify({ message: "invalid_mode" }), { status: 400 });
}
