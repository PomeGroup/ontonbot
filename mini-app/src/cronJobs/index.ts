import { CheckTransactions } from "@/cronJobs/tasks/CheckTransactions";
import { CreateEventOrders } from "@/cronJobs/tasks/CreateEventOrders";
import { UpdateEventCapacity } from "@/cronJobs/tasks/UpdateEventCapacity";
import { MintNFTForPaidOrders } from "@/cronJobs/tasks/MintNFTForPaidOrders";
import { TsCsbtTicketOrder } from "@/cronJobs/tasks/TsCsbtTicketOrder";
import { sendPaymentReminder } from "@/cronJobs/tasks/sendPaymentReminder";
import { OrganizerPromoteProcessing } from "@/cronJobs/tasks/OrganizerPromoteProcessing";
import { createRewards } from "@/cronJobs/tasks/createRewards";
import { notifyUsersForRewards } from "@/cronJobs/tasks/notifyUsersForRewards";
import { cronJobRunner } from "@/cronJobs/cornJobRunner";

const cronJobs = {
  CheckTransactions,
  CreateEventOrders,
  UpdateEventCapacity,
  MintNFTForPaidOrders,
  TsCsbtTicketOrder,
  sendPaymentReminder,
  OrganizerPromoteProcessing,
  createRewards,
  notifyUsersForRewards,
};
export { cronJobRunner };
export default cronJobs;
