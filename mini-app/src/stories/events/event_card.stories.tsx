import EventCard from "@/app/_components/EventCard/EventCard";
import KonstaAppProvider from "@/app/_components/KonstaAppProvider";
import type { Meta, StoryObj } from "@storybook/react";

type EventCardProps = {
  org_name: string;
  title: string;
  startDate: Date;
  endDate: Date;
};

const EventCardStory = ({ org_name, title, endDate, startDate }: EventCardProps) => {
  console.log("Dates", {
    startDate: startDate,
    endDate: endDate,
  });

  return (
    <KonstaAppProvider>
      <div className="bg-brand-bg p-4 w-[400px] rounded flex flex-col gap-4 resize overflow-auto">
        <EventCard
          event={{
            eventUuid: "event-uuid",
            startDate: 1742902251,
            endDate: 1783912251,
            title: "Sample Event",
            subtitle: "This is a sample event subtitle for testing purposes.",
            location: "https://calendar.google.com/calendar/u/0/r",
            city: "New York",
            country: "United States",
            hidden: 0,
            imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
            organizerChannelName: org_name,
            organizerUserId: 1,
            hasPayment: true,
            ticketPrice: 69,
            paymentType: "USDT",
            timezone: "GMT",
            participationType: "online",
            organizerFirstName: "John",
            organizerLastName: "Doe",
            organizerUsername: "john_doe",
            organizerImageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
            reservedCount: 100,
            visitorCount: 1000,
          }}
        />
        <EventCard
          event={{
            eventUuid: "event-uuid",
            startDate: 1742902251,
            endDate: 1782902251,
            title: "Sample Event",
            subtitle: "This is a sample event subtitle for testing purposes.",
            location: "Main Hall",
            city: "New York",
            country: "United States",
            hidden: 0,
            imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
            organizerChannelName: org_name,
            organizerUserId: 1,
            ticketToCheckIn: true,
            ticketPrice: 10,
            timezone: "GMT",
            participationType: "in-person",
            paymentType: "TON",
            organizerFirstName: "John",
            organizerLastName: "Doe",
            organizerUsername: "john_doe",
            reservedCount: 100,
            visitorCount: 1000,
          }}
        />
        <EventCard
          event={{
            eventUuid: "event-uuid",
            startDate: new Date(startDate).getTime() / 1000,
            endDate: new Date(endDate).getTime() / 1000,
            title,
            subtitle: "This is a sample event subtitle for testing purposes.",
            location: "Main Hall",
            city: "New York",
            country: "United States",
            hidden: 0,
            imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
            organizerChannelName: org_name,
            organizerUserId: 1,
            timezone: "GMT",
            participationType: "in-person",
            paymentType: "free",
            organizerFirstName: "John",
            organizerLastName: "Doe",
            organizerUsername: "john_doe",
            reservedCount: 100,
            visitorCount: 1000,
          }}
        />
      </div>
    </KonstaAppProvider>
  );
};

const meta: Meta<typeof EventCardStory> = {
  component: EventCardStory,
  args: {
    org_name: "Sample Organization",
    title: "Sample Event has a long title and it is more than one line",
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
  },
};

export default meta;
type Story = StoryObj<typeof EventCardStory>;

export const Primary: Story = {
  args: {},
};
