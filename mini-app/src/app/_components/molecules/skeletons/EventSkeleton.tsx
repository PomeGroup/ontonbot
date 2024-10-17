import { Skeleton } from "@/components/ui/skeleton";

const EventSkeleton = () => {
    return (
        <div className="py-2">
            <div className="flex justify-between">
                <Skeleton className="rounded-[14px] h-10 w-[131px]" />
                <Skeleton className="rounded-full mb-4 h-10 w-10" />
            </div>

      <Skeleton className="rounded-[14px] h-[220px] w-full" />
      <Skeleton className="my-4 rounded-[14px] h-[87.5px] w-full" />
      <Skeleton className="mt-6 mb-3 rounded-[6px] h-8 w-full" />

      {[...Array(5)].map((_, index) => (
        <Skeleton
          className="h-4 w-full"
          key={index}
        />
      ))}

      {[...Array(2)].map((_, index) => (
        <Skeleton
          className="my-4 rounded-[14px] h-[84px] w-full"
          key={index}
        />
      ))}
    </div>
  );
};

export default EventSkeleton;
