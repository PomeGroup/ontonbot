import EventKeyValue from "@/app/_components/organisms/events/EventKewValue";
import { getDiffValueAndSuffix } from "@/lib/time.utils";
import type { Meta, StoryObj } from "@storybook/react";

type EventDurationProps = {
  startDate?: Date;
  endDate?: Date;
};

const EventDuration = ({ startDate, endDate }: EventDurationProps) => {
  return (
    <EventKeyValue
      label="Duration"
      value={startDate && endDate ? getDiffValueAndSuffix(new Date(startDate), new Date(endDate)).formattedValue : "TBD"}
    />
  );
};

const meta: Meta<typeof EventDuration> = {
  component: EventDuration,
};

export default meta;
type Story = StoryObj<typeof EventDuration>;

export const Primary: Story = {
  args: {
    endDate: new Date(Date.now() + 10000000),
    startDate: new Date(),
  },
};
