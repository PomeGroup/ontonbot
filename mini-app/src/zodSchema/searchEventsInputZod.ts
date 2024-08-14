//
import { z } from "zod";

const searchEventsInputZod = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  search: z.string().optional(),
  filter: z
    .object({
      participationType: z.array(z.enum(["online", "in_person"])).optional(),
      organizer_user_id: z.number().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      event_ids: z.array(z.number()).optional(),
      event_uuids: z.array(z.string()).optional(),
    })
    .optional(),
  sortBy: z
    .enum([
      "default",
      "time",
      "most_people_reached",
      "start_date_asc",
      "start_date_desc",
    ])
    .optional(),
});
export default searchEventsInputZod;
