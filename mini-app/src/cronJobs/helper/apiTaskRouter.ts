import type { CallBackTaskAPINameType, CallBackTaskFunctionType } from "@/db/schema/callbackTasks";
import { addUserTicketFromOnton } from "@/cronJobs/helper/tonfestHandlers"; // Adjust path as needed

// Each handler function's signature
export type HandlerFunction = (_payload: any) => Promise<{ success: boolean; data: any }>;

/**
 * Our router is structured:
 * {
 *   TONFEST: {
 *     addUserTicketFromOnton: (payload) => Promise<{ success, data }>,
 *     ...
 *   },
 *   TS_API: {
 *     ...
 *   }
 * }
 */
export type ApiTaskRouterType = {
  [_api in CallBackTaskAPINameType]?: {
    [_func in CallBackTaskFunctionType]?: HandlerFunction;
  };
};

export const ApiTaskRouter: ApiTaskRouterType = {
  TONFEST: {
    addUserTicketFromOnton,
    // createTonfestOrder, // if you have that function
  },
  TS_API: {
    // For TS_API, you can add something like someOtherFunction: ...
  },
};
