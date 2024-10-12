import { Skeleton } from "@/components/ui/skeleton";

const EventsSkeleton = () => {
  return (
    <div>
      <Skeleton className="rounded-[6px] mb-4 h-10 w-full" />
      <Skeleton className="rounded-[14px] mb-4 h-[346px] w-full" />
      <Skeleton className="rounded-[14px] h-[346px] w-full" />
    </div>
  );
};

export default EventsSkeleton;
