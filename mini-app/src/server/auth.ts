import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export function getAuthenticatedUser(): [number, null] | [null, Response] {
  const userToken = cookies().get("token");

  if (!userToken) {
    return [
      null,
      Response.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      ),
    ];
  }

  try {
    // validate user token
    const validation = verify(userToken.value, process.env.BOT_TOKEN as string);

    if (typeof validation === "string") {
      return [
        null,
        Response.json(
          { error: "Unauthorized: Validation failed" },
          { status: 401 }
        ),
      ];
    }

    return [validation.id as number, null];
  } catch (err) {
    return [
      null,
      Response.json({ error: "Unauthorized: invalid token" }, { status: 401 }),
    ];
  }
}

/**
 * By using this function in routes.
 * that route need to have a 'x-api-key' header to be accessed
 * @param req {Request}
 */
export function apiKeyAuthentication(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey)
    return Response.json(
      {
        error: "authentication_failed",
        message: "No x-api-key header found",
      },
      { status: 401 }
    );

  if (apiKey !== process.env.ONTON_API_SECRET)
    return Response.json(
      {
        error: "authentication_failed",
        message: "Invalid x-api-key header found",
      },
      { status: 401 }
    );

  return null;
}
