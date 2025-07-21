import Typography from "@/components/Typography";
import { Badge } from "@/components/ui/badge";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import { Divider } from "@mui/material";
import Image from "next/image";
import TicketEdit from "./TicketEdit";

export default function TicketCard(props: { ticket: Omit<EventPaymentSelectType, "created_at" | "updatedAt"> }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-2lg">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className="w-13 h-13 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={props.ticket.ticketImage || "/template-images/default.webp"}
              alt={props.ticket.title}
              width={52}
              height={52}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-around gap-1 my-auto">
            <Typography
              variant="callout"
              className="line-clamp-1"
            >
              {props.ticket.title}
            </Typography>
            <Typography
              variant="footnote"
              className="text-[#8e8e93] line-clamp-1"
            >
              {props.ticket.description}
            </Typography>
          </div>
        </div>
        {/* Edit Button */}
        <TicketEdit ticket={props.ticket} />
      </div>

      <div className="flex gap-2">
        {/* if sold out, show badge */}
        {props.ticket.reserved_count === props.ticket.bought_capacity && <Badge variant="ontonLight">Sold Out</Badge>}
        {/* if not active, show badge */}
        {!props.ticket.active && <Badge variant="destructive">Not Active</Badge>}
      </div>
      <Divider />

      {/* Ticket Details */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Typography
            variant="footnote"
            className="text-[#8e8e93]"
          >
            Price
          </Typography>
          <Typography
            variant="subheadline1"
            className="text-[#000000]"
            weight="medium"
          >
            {props.ticket.price} {props.ticket.payment_type}
          </Typography>
        </div>

        <div className="flex justify-between items-center">
          <Typography
            variant="footnote"
            className="text-[#8e8e93]"
          >
            Type
          </Typography>
          <Typography
            variant="subheadline1"
            className="text-[#000000]"
            weight="medium"
          >
            {props.ticket.ticket_type}
          </Typography>
        </div>

        <div className="flex justify-between items-center">
          <Typography
            variant="footnote"
            className="text-[#8e8e93]"
          >
            Capacity
          </Typography>
          <Typography
            variant="subheadline1"
            weight="medium"
            className="text-[#000000]"
          >
            {props.ticket.bought_capacity}
          </Typography>
        </div>

        {/* Organizer Payout */}
        <div className="flex justify-between items-center">
          <Typography
            variant="footnote"
            className="text-[#8e8e93]"
          >
            Payout Status
          </Typography>
          <Typography
            variant="subheadline1"
            weight="medium"
            className="text-[#000000] capitalize"
          >
            {props.ticket.organizer_payment_status.split("_").join(" ")}
          </Typography>
        </div>
      </div>
    </div>
  );
}
