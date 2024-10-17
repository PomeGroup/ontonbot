import { env } from "../../env.mjs";

type User = {
  wallet_address: string | null;
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  role: string;
  created_at: Date | null;
  updatedAt: Date | null;
  updatedBy: string;
};

export async function getUser(userId: number) {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
    {
      headers: {
        "x-api-key": env.ONTON_API_KEY,
      },
    }
  );

  return response.ok ? ((await response.json()) as User) : null;
}
