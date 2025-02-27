import "@/lib/gracefullyShutdown";
import { getAuthenticatedUserApi } from "@/server/auth";
import externalSellerApi from "@/lib/externalSeller.api";
import ordersDB from "@/server/db/orders.db";

export async function POST(request: Request) {
  if (request.method === "OPTIONS") {
    return Response.json(null, { status: 204 }); // Handle preflight requests
  }
  // 1) Authentication check
  const [eventOwner, authError] = await getAuthenticatedUserApi(request);
  if (authError) {
    return authError;
  }

  try {
    // 2) Parse & validate
    const { telegramUserId, telegramUsername, eventUuid, paymentType, paymentAmount } =
      await externalSellerApi.parseAndValidateRequest(request);
    if (eventUuid !== "c5f9bd59-a46b-4dce-91cb-3cd146b255a5") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Your API KEY has Not permission to use this endpoint",
          status: "access_blocked",
        }),
        { status: 500 }
      );
    }
    // 3) Fetch & validate event (ownership, etc.)
    const eventData = await externalSellerApi.fetchAndValidateEvent(eventUuid, eventOwner);

    // 4) Fetch payment info, check sold out, determine orderType
    const orderType = await externalSellerApi.fetchPaymentInfoAndCheckSoldOut(eventUuid, eventData);

    // 5) Ensure user exists
    const user = await externalSellerApi.ensureUserExists(telegramUserId, telegramUsername);

    // 6) Check for existing completed order
    const existingOrder = await ordersDB.findExistingCompletedOrder(eventUuid, telegramUserId, orderType);
    if (existingOrder) {
      return await externalSellerApi.handleExistingOrder(existingOrder, eventUuid, telegramUserId, !!user, orderType);
    }

    // 7) Create new order & registrant
    const newOrder = await externalSellerApi.createOrderAndRegistrant(
      eventUuid,
      telegramUserId,
      paymentAmount,
      paymentType,
      orderType,
      telegramUsername
    );

    if (!newOrder) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create order",
          status: "order_creation_failed",
        }),
        { status: 500 }
      );
    }

    // 8) Compute SBT claim link
    const sbtClaimLink = await externalSellerApi.getSbtClaimLink(eventUuid, telegramUserId, orderType);

    // 9) Return success
    return new Response(
      JSON.stringify({
        success: true,
        isOntonUser: true,
        sbtClaimLink,
      }),
      { status: 200 }
    );
  } catch (err) {
    if (externalSellerApi.isStructuredErrorShape(err)) {
      return new Response(JSON.stringify(err.errorBody), { status: err.status });
    }

    // fallback
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        status: "bad_request",
      }),
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
