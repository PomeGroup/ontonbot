import { env } from "~/env.mjs";
import { toast } from "@ui/base/sonner";

type UpdateTicketInfoProps = {
  data: {
    full_name: string;
    telegram: string;
    company: string;
    position: string;
  }
  proof_token: string
}

export const updateTicketInfo = async (nftaddress: string, newInfo: UpdateTicketInfoProps) => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL_ONTON}/ticket/${nftaddress}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newInfo),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData?.message || "Failed to update ticket"
    toast.error(message)
    return {
      status: 'error',
      message: 'Fialed to update ticket info'
    } as const
  }

  const data = await response.json();
  console.log("Ticket updated successfully", data);
  return {
    status: 'success',
    message: 'Ticket updated successfully'
  } as const
}
