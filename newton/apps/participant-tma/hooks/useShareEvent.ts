import { useMutation } from "@tanstack/react-query";

import { env } from "~/env.mjs";

export function useShareEvent() {
  return useMutation({
    mutationFn: async ({
      user_id,
      event_uuid,
    }: {
      user_id: string;
      event_uuid: string;
    }) => {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_BASE_URL}/share-event?user_id=${user_id}&event_uuid=${event_uuid}`,
      );

      if (!res.ok) {
        throw new Error("there was an error sharing event");
      }

      return await res.json();
    },
  });
}
