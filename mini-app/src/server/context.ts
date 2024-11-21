import { validateMiniAppData } from "@/utils";
import { usersDB } from "./db/users";

export async function createContext({ req }: { req: Request }) {
  // get user from init data passed as authorization header
  async function getUserFromHeader() {
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const initData = authHeader;

      if (!initData) {
        return null;
      }

      const { valid, initDataJson } = validateMiniAppData(initData);

      if (!valid) {
        return null;
      }

      const user = await usersDB.insertUser(initDataJson);
      if (!user) {
        return null;
      }

      return user;
    }
    return null;
  }

  const user = await getUserFromHeader();

  return {
    user,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
