import EventCardSkeleton from "../_components/EventCard/EventCardSkeleton";

export default function Loading() {
  return (
    <div className="p-4 space-y-4 bg-brand-bg min-h-screen">
      {/* Search input and square */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search input"
          className="flex-grow border p-2 bg-gray-100 rounded-2lg"
          disabled
        />
        <div className="w-10 h-10 bg-white rounded-2lg" />
      </div>
      {/* List of rectangle placeholders */}
      <div className="space-y-2">
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </div>
  );
}
