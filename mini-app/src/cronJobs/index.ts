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
import { consumeClickBatch } from "@/cronJobs/tasks/consumeClickBatch";
import { generateInviteLinksCron } from "@/cronJobs/tasks/generateInviteLinksCron";
import { updateAllTournaments } from "@/cronJobs/tasks/updateTournaments";
import { processRecentlyEndedTournaments } from "@/cronJobs/tasks/tournamentRewards";
import { sendTournamentRewardsNotifications } from "@/cronJobs/tasks/sendTournamentRewardsNotifications";
import { processCampaignOrders } from "@/cronJobs/tasks/processCampaignOrders";
import { processCampaignAffiliateSpins } from "@/cronJobs/tasks/processCampaignAffiliateSpins";
import { updateAllUserWalletBalances } from "@/cronJobs/tasks/updateAllUserWalletBalances";

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
  consumeClickBatch,
  generateInviteLinksCron,
  updateAllTournaments,
  processRecentlyEndedTournaments,
  sendTournamentRewardsNotifications,
  processCampaignOrders,
  processCampaignAffiliateSpins,
  updateAllUserWalletBalances,
};
export { cronJobRunner };
export default cronJobs;
