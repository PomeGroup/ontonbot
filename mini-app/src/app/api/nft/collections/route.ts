import { getAuthenticatedNftApi } from "@/server/utils/getAuthenticatedNftApi";
import { nftApiMinterWalletsDB } from "@/db/modules/nftApiMinterWallets.db";
import { nftApiCollectionsDB } from "@/db/modules/nftApiCollections.db";
import { logger } from "@/server/utils/logger";

export async function POST(request: Request) {
  // 1) Handle Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // 2) Authenticate
  const [apiKeyRecord, authError] = await getAuthenticatedNftApi(request);
  if (authError || !apiKeyRecord) return authError; // 401 or 500

  try {
    // 3) Parse body
    const body = await request.json();

    const { walletAddress, collectionData, userCallbackUrl } = body;
    logger.log("POST /collections", { walletAddress, collectionData, userCallbackUrl });
    if (!walletAddress || !collectionData) {
      return new Response(JSON.stringify({ error: "Missing walletAddress or collectionData" }), { status: 400 });
    }

    // Basic validation of collectionData
    if (!collectionData.name || !collectionData.description || !collectionData.image) {
      return new Response(JSON.stringify({ error: "Invalid or missing name/description/image" }), { status: 400 });
    }
    if (collectionData.social_links && !Array.isArray(collectionData.social_links)) {
      return new Response(JSON.stringify({ error: "social_links must be an array" }), { status: 400 });
    }
    if (collectionData.royalties && (collectionData.royalties < 0 || collectionData.royalties > 100)) {
      return new Response(JSON.stringify({ error: "Royalties must be between 0 and 100" }), { status: 400 });
    }

    const walletRow = await nftApiMinterWalletsDB.findByAddress(apiKeyRecord.id, walletAddress);
    if (!walletRow) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), { status: 404 });
    }

    // 5) Insert a row in nft_api_collections with "CREATING"
    const inserted = await nftApiCollectionsDB.create({
      minterWalletId: walletRow.id,
      apiKeyId: apiKeyRecord.id,

      name: collectionData.name,
      description: collectionData.description,
      image: collectionData.image,
      coverImage: collectionData.cover_image,
      socialLinks: collectionData.social_links ?? null,
      royalties: collectionData.royalties ?? null,

      // We start with no address and status "CREATING"
      address: null,
      friendlyAddress: null,
    });

    // Optionally, store userCallbackUrl in a separate table or column if you want
    // For now, we skip it or store it in the collection row if you have a column

    // 6) Return success
    return new Response(
      JSON.stringify({
        collectionId: inserted.id,
        address: inserted.address, // null
        status: inserted.status, // "CREATING"
        minterAddress: walletAddress,
        collectionData, // the data user provided
      }),
      { status: 200 }
    );
  } catch (err) {
    logger.error("POST /collections error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
