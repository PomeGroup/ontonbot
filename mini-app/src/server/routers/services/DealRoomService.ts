import axios from "axios";

/**
 * Refresh the guest list using the provided code
 * @param code The code to refresh the guest list
 * @returns A response object with the success status and message
 * @throws An error if the request fails
 */
const dealRoomBaseUrl = "https://letsgo.dealroomevents.com/v1/";
export const RefreshGuestList = async (code: string) => {
  try {
    const response = await axios.get(
      `${dealRoomBaseUrl}url/action?code=${code}`
    );

    if (response.status === 200 && response.data.success === true) {
      return { success: true, message: "share message sent successfully" };
    }

    return { success: false, message: "share message failed" };
  } catch (error) {
    console.error("Error fetching URL:", error);
    return {
      success: false,
      message: "An error occurred while processing your request",
    };
  }
};

const dealRoomService = {
  RefreshGuestList,
};
export default dealRoomService;
