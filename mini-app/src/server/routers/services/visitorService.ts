// Helper function to validate and retrieve visitor
import {
  addVisitor,
  getVisitor,
  selectValidVisitorById,
} from "@/server/db/visitors";

export const getAndValidateVisitor = async (
  user_id: number,
  event_uuid: string,
  ticketOrderUuid?: string | null
) => {
  try {
    // Check if the visitor exists, depending on the ticketOrderUuid
    const visitor = ticketOrderUuid
      ? await addVisitor(user_id, event_uuid)
      : await getVisitor(user_id, event_uuid);

    // If visitor not found, return a failure response
    if (!visitor || !visitor?.id) {
      return {
        success: false,
        error: `Visitor not found for user ID: ${user_id} and event UUID: ${event_uuid}`,
      };
    }

    // If no ticketOrderUuid, validate if the visitor is valid
    if (!ticketOrderUuid) {
      const isValidVisitor = await selectValidVisitorById(visitor.id);

      // If the visitor is invalid, return a failure response
      if (!isValidVisitor.length) {
        return {
          success: false,
          error: "Invalid visitor: complete the tasks first.",
        };
      }
    }

    // If everything is valid, return the visitor information
    return { success: true, data: visitor };
  } catch (error) {
    // Catch any unexpected errors and return them
    const errorMsg =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`getAndValidateVisitor Unexpected Error:`, error);
    return {
      success: false,
      error: errorMsg,
    };
  }
};
const visitorService = {
  getAndValidateVisitor,
};

export default visitorService;
