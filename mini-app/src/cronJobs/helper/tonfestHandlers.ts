import { sendHttpRequest } from "@/lib/httpHelpers";

export const addUserTicketFromOnton = async (payload: any): Promise<{ success: boolean; data: any }> => {
  const endpoint = "https://api-public-test.ton-fest.com/external-partners/onton/addUserTicketFromOnton";

  // Construct headers, method, etc. right here
  const headers = {
    "Content-Type": "application/json",
    Authorization: process.env.TONFEST_AUTH_TOKEN || "",
  };

  try {
    const { success, data } = await sendHttpRequest("POST", endpoint, headers, payload);
    if (!data.success) {
      console.error("Failed to add user ticket from Onton:", data);
      return { success: false, data: { error: data.error } };
    }
    return { success, data };
  } catch (err: any) {
    return { success: false, data: { error: err.message } };
  }
};

// If you have more TonFest endpoints, define them similarly...
