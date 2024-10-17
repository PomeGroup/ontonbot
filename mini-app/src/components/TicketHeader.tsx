type EventHeaderProps = {
  ticketId: number;
  description: string;
};

const TicketHeader = (props: EventHeaderProps) => {
  return (
    <div className="grid grid-cols-7 items-start justify-start gap-y-1.5">
      <h1 className="col-span-6 text-2xl font-medium">{`Ticket #${props.ticketId}`}</h1>
      <p className="col-span-full text-[15px]">{props.description}</p>
    </div>
  );
};

export default TicketHeader;
