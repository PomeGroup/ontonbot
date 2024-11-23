import {
  developmentEnvironment,
  eventParticipationType,
  orderState,
  rewardStatus,
  rewardType,
  ticketStatus,
} from "@/db/enum";

import { airdropRoutineRelations, airdropRoutines } from "./schema/airdropRoutines";
import { eventFieldRelations, eventFields } from "./schema/eventFields";
import { eventTicket } from "./schema/eventTicket";
import { event_details_search_list } from "./schema/event_details_search_list";
import { events } from "./schema/events";
import { giataCity } from "./schema/giataCity";
import { ontoSetting } from "./schema/ontoSetting";
import { orders } from "./schema/orders";
import { rewards } from "./schema/rewards";
import { sbtRewardCollections } from "./schema/sbtRewardCollections";
import { tickets, ticketsRelations } from "./schema/tickets";
import { specialGuests } from "@/db/schema/specialGuest";
import { userEventFieldRelations, userEventFields } from "./schema/userEventFields";
import { userRelations, users } from "./schema/users";
import { visitors } from "./schema/visitors";
import { sideEvents } from "./schema/sideEvents";
import { eventRegistrants, eventRegistrantStatus } from "./schema/eventRegistrants";

// export all the enums
export { developmentEnvironment, eventParticipationType, orderState, rewardStatus, rewardType, ticketStatus };

// export all the tables and relations
export {
  airdropRoutineRelations,
  airdropRoutines,
  eventFieldRelations,
  eventFields,
  eventTicket,
  event_details_search_list,
  events,
  giataCity,
  ontoSetting,
  orders,
  rewards,
  tickets,
  ticketsRelations,
  sideEvents,
  specialGuests,
  userEventFieldRelations,
  userEventFields,
  userRelations,
  users,
  visitors,
  sbtRewardCollections,
  eventRegistrants,
  eventRegistrantStatus,
};
