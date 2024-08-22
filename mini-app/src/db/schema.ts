import {
  eventParticipationType,
  rewardType,
  rewardStatus,
  ticketStatus,
  orderState,
} from "@/db/enum";

import {
  airdropRoutines,
  airdropRoutineRelations,
} from "./schema/airdropRoutines";
import { event_details_search_list } from "./schema/event_details_search_list";
import { eventFields, eventFieldRelations } from "./schema/eventFields";
import { events } from "./schema/events";
import { eventTicket } from "./schema/eventTicket";
import { giataCity } from "./schema/giataCity";
import { orders } from "./schema/orders";
import { rewards } from "./schema/rewards";
import { tickets, ticketsRelations } from "./schema/tickets";
import {
  userEventFields,
  userEventFieldRelations,
} from "./schema/userEventFields";
import { users, userRelations } from "./schema/users";
import { visitors } from "./schema/visitors";

// export all the enums
export {
  eventParticipationType,
  rewardType,
  rewardStatus,
  ticketStatus,
  orderState,
};

// export all the tables and relations
export {
  airdropRoutines,
  airdropRoutineRelations,
  event_details_search_list,
  eventFields,
  eventFieldRelations,
  events,
  eventTicket,
  giataCity,
  orders,
  rewards,
  tickets,
  ticketsRelations,
  userEventFields,
  userEventFieldRelations,
  users,
  userRelations,
  visitors,
};
