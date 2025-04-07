import EventsTimeline from "@/app/_components/Event/EventsTImeline";
import KonstaAppProvider from "@/app/_components/KonstaAppProvider";
import { Meta, StoryObj } from "@storybook/react";

// Generate some mock data for the timeline.
const mockEvents = [
  {
    eventUuid: "event-1",
    startDate: Math.floor(new Date("2023-09-10T10:00:00Z").getTime() / 1000),
    endDate: Math.floor(new Date("2023-09-10T12:00:00Z").getTime() / 1000),
    title: "Morning Meeting",
    subtitle: "Discuss project goals.",
    location: "Conference Room A",
    city: "New York",
    country: "United States",
    hidden: 0,
    imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
    organizerChannelName: "Org A",
    organizerUserId: 1,
    timezone: "GMT",
    participationType: "in-person",
    paymentType: "free",
    organizerFirstName: "Alice",
    organizerLastName: "Smith",
    organizerUsername: "alice_smith",
    reservedCount: 50,
    visitorCount: 200,
  },
  {
    eventUuid: "event-2",
    startDate: Math.floor(new Date("2023-09-10T15:00:00Z").getTime() / 1000),
    endDate: Math.floor(new Date("2023-09-10T17:00:00Z").getTime() / 1000),
    title: "Afternoon Workshop",
    subtitle: "Hands-on session.",
    location: "Lab 2",
    city: "New York",
    country: "United States",
    hidden: 0,
    imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
    organizerChannelName: "Org B",
    organizerUserId: 2,
    timezone: "GMT",
    participationType: "online",
    paymentType: "free",
    organizerFirstName: "Bob",
    organizerLastName: "Johnson",
    organizerUsername: "bob_johnson",
    reservedCount: 30,
    visitorCount: 150,
  },
  {
    eventUuid: "event-3",
    startDate: Math.floor(new Date("2023-09-11T09:00:00Z").getTime() / 1000),
    endDate: Math.floor(new Date("2023-09-11T11:00:00Z").getTime() / 1000),
    title: "Team Standup",
    subtitle: "Daily team update.",
    location: "Virtual",
    city: "New York",
    country: "United States",
    hidden: 0,
    imageUrl: "https://storage.onton.live/onton/event/a4eac5f8d7_1742791654102_event_image.png",
    organizerChannelName: "Org C",
    organizerUserId: 3,
    timezone: "GMT",
    participationType: "in-person",
    paymentType: "free",
    organizerFirstName: "Charlie",
    organizerLastName: "Lee",
    organizerUsername: "charlie_lee",
    reservedCount: 20,
    visitorCount: 100,
  },
];

const TimelineStory = (props: { isLoading: boolean; preserveDataOnFetching: boolean }) => (
  <KonstaAppProvider>
    <div className="p-4">
      <EventsTimeline
        isLoading={props.isLoading}
        preserveDataOnFetching={props.preserveDataOnFetching}
        events={mockEvents}
      />
    </div>
  </KonstaAppProvider>
);

const meta: Meta<typeof TimelineStory> = {
  title: "Events/Timeline",
  component: TimelineStory,
  args: {
    isLoading: false,
    preserveDataOnFetching: false,
  },
  argTypes: {
    preserveDataOnFetching: {
      description: "Useful in infante lists",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimelineStory>;

export const Primary: Story = {};
