//
import {z} from "zod";

const searchEventsInputZod = z.object({
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
    search: z.string().optional(),
    filter: z.object({
        eventTypes: z.array(z.enum(["online", "in_person"])).optional(),
        organizer_user_id: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }).optional(),
    sortBy: z.enum(["default", "time", "most_people_reached"]).optional(),
});
export default searchEventsInputZod;