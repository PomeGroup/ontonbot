import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

import { env } from "../../env.mjs";

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
    const validation = verify(userToken.value, env.BOT_TOKEN as string);

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
