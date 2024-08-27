import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { eventsRouter } from "./routers/events";
import { fieldsRouter } from "./routers/files";
import { locationRouter } from "./routers/location";
import { userEventFieldsRouter } from "./routers/userEventFields";
import { usersRouter } from "./routers/users";
import { visitorsRouter } from "./routers/visitors";
import { router } from "./trpc";
import {configRouter} from "@/server/routers/OntonSetting";
import {ticketRouter} from "@/server/routers/tickets";

export const appRouter = router({
  users: usersRouter,
  visitors: visitorsRouter,
  events: eventsRouter,
  files: fieldsRouter,
  userEventFields: userEventFieldsRouter,
  location: locationRouter,
  config : configRouter,
  ticket: ticketRouter,
});

export type AppRouter = typeof appRouter;

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
