import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { eventsRouter } from "./routers/events";
import { fieldsRouter } from "./routers/files";
import { userEventFieldsRouter } from "./routers/userEventFields";
import { usersRouter } from "./routers/users";
import { visitorsRouter } from "./routers/visitors";
import { router } from "./trpc";

export const appRouter = router({
  users: usersRouter,
  visitors: visitorsRouter,
  events: eventsRouter,
  files: fieldsRouter,
  userEventFields: userEventFieldsRouter,
});

export type AppRouter = typeof appRouter;

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
