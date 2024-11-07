const EventContent = ({ content }: { content: string }) => {
  return (
    <div className={"text-telegram-text-color grid gap-2"}>
      <h2 className={"type-title-3 font-bold"}>About</h2>
      <p className={"type-callout whitespace-pre-line"}>{content}</p>
      {/* <h6 className={"type-headline type-headline-7"}>Section title</h6>
      <ul
        role={"list"}
        className={"marker:text-telegram-6-10-accent-text-color list-disc pl-5"}
      >
        <li className={"type-callout type-body-1"}>
          Develop a visual language for new products and events.
        </li>
        <li className={"type-callout type-body-1"}>
          Work with the team to develop and change the overall style of the TON
          brand.
        </li>
        <li className={"type-callout type-body-1"}>
          Work with the team to develop and change
        </li>
      </ul>
      <p className={"type-callout type-subtitle-1"}>
        The Gateway is an annual event for the TON Community. With TON
        blockchain, the mission is to put crypto in every pocket by acting as a
        gateway to Web3 for millions of people in Telegram.
      </p> */}
    </div>
  );
};
export default EventContent;
