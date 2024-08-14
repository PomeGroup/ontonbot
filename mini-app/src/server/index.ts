import { router } from "./trpc";
import { usersRouter } from "./routers/users";
import { visitorsRouter } from "./routers/visitors";
import { eventsRouter } from "./routers/events";
import { userEventFieldsRouter } from "./routers/userEventFields";

export const appRouter = router({
  users: usersRouter,
  visitors: visitorsRouter,
  events: eventsRouter,
  userEventFields: userEventFieldsRouter,
});

export type AppRouter = typeof appRouter;
