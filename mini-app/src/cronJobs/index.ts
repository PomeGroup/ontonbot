import { CheckTransactions } from "@/cronJobs/tasks/CheckTransactions";
import { CreateEventOrders } from "@/cronJobs/tasks/CreateEventOrders";
import { UpdateEventCapacity } from "@/cronJobs/tasks/UpdateEventCapacity";
import { MintNFTForPaidOrders } from "@/cronJobs/tasks/MintNFTForPaidOrders";
import { TsCsbtTicketOrder } from "@/cronJobs/tasks/TsCsbtTicketOrder";
import { sendPaymentReminder } from "@/cronJobs/tasks/sendPaymentReminder";
import { OrganizerPromoteProcessing } from "@/cronJobs/tasks/OrganizerPromoteProcessing";
import { CreateRewards } from "@/cronJobs/tasks/CreateRewards";
import { notifyUsersForRewards } from "@/cronJobs/tasks/notifyUsersForRewards";
import { cronJobRunner } from "@/cronJobs/cornJobRunner";
import { syncSbtCollectionsForEvents } from "@/cronJobs/tasks/syncSbtCollectionsForEvents";
import { CheckAllUsersBlock } from "@/cronJobs/tasks/checkBlockStatus";
import { CheckSbtStatus } from "@/cronJobs/tasks/checkTSRewardStatus";
import { runPendingCallbackTasks } from "@/cronJobs/tasks/runAPIPendingCallbackTasks";

const cronJobs = {
  CheckTransactions,
  CreateEventOrders,
  UpdateEventCapacity,
  MintNFTForPaidOrders,
  TsCsbtTicketOrder,
  sendPaymentReminder,
  OrganizerPromoteProcessing,
  CreateRewards,
  notifyUsersForRewards,
  syncSbtCollectionsForEvents,
  CheckAllUsersBlock,
  CheckSbtStatus,
  runPendingCallbackTasks,
};
export { cronJobRunner };
export default cronJobs;
