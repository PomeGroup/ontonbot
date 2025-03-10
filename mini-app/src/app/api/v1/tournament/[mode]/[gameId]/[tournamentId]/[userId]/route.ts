import { NextRequest } from "next/server";
import { apiKeyAuthentication, getAuthenticatedUser } from "@/server/auth";
import { getTournamentDetails } from "@/lib/elympicsApi";
import { gamesDB } from "@/server/db/games.db";
import { tournamentsDB } from "@/server/db/tournaments.db";
import { logger } from "@/server/utils/logger";
import sizeOf from "image-size";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import axios from "axios";
import FormData from "form-data";
import formidable, { Fields, Files, File as FormidableFile } from "formidable";
import jwt from "jsonwebtoken";
import fs from "fs";
import { toNodeJsRequest } from "@/app/api/files/helpers/toNodeJsRequest";

const ELYMPICS_PUBLISHER_KEY = process.env.ELYMPICS_PUBLISHER_KEY || "";
const ELYMPICS_BEARER_TOKEN = process.env.ELYMPICS_BEARER_TOKEN || "";
const UPLOAD_FILE_ENDPOINT = process.env.UPLOAD_FILE_ENDPOINT || "http://localhost:3000/api/files/upload";
const UPLOAD_TOKEN = process.env.ONTON_API_SECRET || "fallback-secret";

// Ensure we're using the Node.js runtime (not Edge)
export const config = {
  runtime: "nodejs",
};

/**
 * 1) parseMultipartForm:
 *    - Reads the entire request body into a Buffer
 *    - Wraps it in a Node.js Readable stream
 *    - Parses with Formidable
 */
export async function parseMultipartForm(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error("Must be multipart/form-data");
  }

  // Create Formidable instance (10 MB limit, etc.)
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
    multiples: false,
  });
  const nodeReq = await toNodeJsRequest(req);

  // Parse the Node.js stream with Formidable
  return new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        logger.log(`Error parsing formData: ${err}`);
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

/**
 * POST /api/tournament/create/[gameId]/[tournamentId]/[telegramId]
 *
 * Expects multipart/form-data with a "file" field for the tournament image.
 * Steps:
 * 1) Auth checks
 * 2) Parse + read file from 'fileData.filepath' => Buffer
 * 3) Validate image dimension + ClamAV
 * 4) Upload to Minio (via your /files/upload endpoint)
 * 5) Fetch Elympics => create local DB record => return success
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { gameId: string; tournamentId: string; userId: string } }
) {
  // 1) Auth checks
  const [, userError] = getAuthenticatedUser();
  const apiKeyError = apiKeyAuthentication(req);
  if (userError && apiKeyError) {
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  }

  const { gameId, tournamentId, userId } = params;
  if (!gameId || !tournamentId) {
    return new Response(JSON.stringify({ message: "missing_game_or_tournament_id" }), { status: 400 });
  }

  // 2) Parse the form => get 'file' from Formidable
  let fileBuffer: Buffer | null = null;
  let mimeType: string | null = null;

  try {
    const { files } = await parseMultipartForm(req);
    if (!files || !files.file) {
      return new Response(JSON.stringify({ message: "file_required" }), { status: 400 });
    }

    // If multiple files, just pick the first
    const fileData = Array.isArray(files.file) ? files.file[0] : files.file;

    // Use fs.readFileSync(...) on the 'filepath'
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

  // 2a) Validate image dimensions
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

  // 2b) ClamAV scan
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

  // 3) Upload to your file endpoint (/files/upload) with FormData
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

  // 4) Fetch Elympics data => validate
  let details;
  try {
    details = await getTournamentDetails(ELYMPICS_PUBLISHER_KEY, ELYMPICS_BEARER_TOKEN, tournamentId);
    if (!details) {
      return new Response(JSON.stringify({ message: "tournament_not_found_in_elympics" }), { status: 404 });
    }
    if (details.GameId !== gameId) {
      return new Response(JSON.stringify({ message: "mismatched_game_id", expected: gameId, actual: details.GameId }), {
        status: 400,
      });
    }
  } catch (error) {
    logger.error("Error fetching Elympics tournament:", error);
    return new Response(JSON.stringify({ message: "elympics_fetch_error" }), { status: 500 });
  }

  // 5) Insert into local DB => games + tournaments
  try {
    // Insert game if needed
    const gameRow = await gamesDB.addGame({
      hostGameId: gameId,
      name: details.Name ?? "",
      imageUrl: "",
      rawGameJson: details as any,
    });

    // Insert tournament (store 'uploadedImageUrl' in the DB)
    const insertedTournament = await tournamentsDB.addTournament({
      hostTournamentId: details.Id,
      hostTournamentGuid: details.TournamentGuid,
      gameId: gameRow?.id ?? 1,
      createdByUserId: parseInt(params.userId, 10) || 0,
      owner: parseInt(params.userId, 10) || 0,
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
      return new Response(JSON.stringify({ message: "failed_to_insert_tournament" }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "success", tournament: insertedTournament }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    logger.error("Error creating tournament in DB:", err);
    return new Response(JSON.stringify({ message: "db_insert_error" }), { status: 500 });
  }
}
