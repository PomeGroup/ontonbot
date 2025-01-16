import {
  developmentEnvironment,
  eventParticipationType,
  orderState,
  orderTypes,
  ticketTypes,
  paymentTypes,
  rewardStatus,
  rewardType,
  ticketStatus,
  EventTriggerType,
  eventTriggerType,
  EventTriggerStatus,
  eventTriggerStatus,
  notificationType,
  NotificationType,
  notificationStatus,
  NotificationStatus,
  notificationItemType,
  NotificationItemType,
  eventPoaResultStatus,
  EventPoaResultStatus,
} from "@/db/enum";

import { airdropRoutineRelations, airdropRoutines } from "./schema/airdropRoutines";
import { eventFieldRelations, eventFields } from "./schema/eventFields";
import { eventPayment, organizerPaymentStatus } from "./schema/eventPayment";
import { event_details_search_list } from "./schema/event_details_search_list";
import { eventPoaTriggers, eventPoaTriggersIndexes } from "./schema/eventPoaTriggers";
import { eventPoaResults, eventPoaResultsIndexes } from "./schema/eventPoaResults";
import { events } from "./schema/events";
import { giataCity } from "./schema/giataCity";
import { ontoSetting } from "./schema/ontoSetting";
import { orders } from "./schema/orders";
import { notifications } from "./schema/notifications";
import { rewards } from "./schema/rewards";
import { sbtRewardCollections } from "./schema/sbtRewardCollections";
import { tickets, ticketsRelations } from "./schema/tickets";
import { specialGuests } from "@/db/schema/specialGuest";
import { userEventFieldRelations, userEventFields } from "./schema/userEventFields";
import { userRelations, users } from "./schema/users";
import { visitors } from "./schema/visitors";
import { sideEvents } from "./schema/sideEvents";
import { eventRegistrants, eventRegistrantStatus } from "./schema/eventRegistrants";
import { walletChecks } from "./schema/walletChecks";
import { nftItems } from "./schema/nft_items";
import { coupon_definition, coupon_definition_status, coupon_definition_type } from "./schema/coupon_definition";
import { coupon_item_status, coupon_items } from "./schema/coupon_item";

// export all the enums
export {
  developmentEnvironment,
  eventParticipationType,
  eventTriggerType,
  eventTriggerStatus,
  orderState,
  orderTypes,
  paymentTypes,
  rewardStatus,
  rewardType,
  ticketStatus,
  notificationType,
  notificationStatus,
  notificationItemType,
  eventPoaResultStatus,
  ticketTypes,
  coupon_definition_type,
  coupon_definition_status,
  coupon_item_status,
};

// export all the tables and relations
export {
  airdropRoutineRelations,
  airdropRoutines,
  eventFieldRelations,
  eventFields,
  eventPayment,
  event_details_search_list,
  eventPoaTriggers,
  eventPoaTriggersIndexes,
  eventPoaResults,
  eventPoaResultsIndexes,
  events,
  giataCity,
  notifications,
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
  organizerPaymentStatus,
  walletChecks,
  nftItems,
  coupon_definition,
  coupon_items,
};

// Type Exports
export type { EventTriggerType };
export type { EventTriggerStatus };
export type { NotificationStatus };
export type { NotificationType };
export type { NotificationItemType };
export type { EventPoaResultStatus };
