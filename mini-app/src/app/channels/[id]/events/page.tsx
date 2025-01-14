"use client";

import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import useAuth from "@/hooks/useAuth";
import { Block } from "konsta/react";
import { noop } from "lodash";
import { Fragment, useCallback, useRef } from "react";

type Props = { params: { id: string } };

export default function OrganizerEventsPage({ params }: Props) {
  const { user } = useAuth();
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, status } =
    trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
      { filter: { organizer_user_id: Number(params.id) } },
      {
        getNextPageParam(lastPage) {
          return lastPage.nextCursor;
        },
      }
    );

  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error fetching data</p>;

  return (
    <Block
      margin="0"
      className="flex-wrap bg-[rgba(239,239,244,1)] pt-8 pb-16 min-h-screen"
    >
      <Typography
        variant="title2"
        className="mb-6"
      >
        Organizer Events
      </Typography>
      <div className="flex flex-col w-full">
        {data?.pages.map((page, pageIndex) => (
          <Fragment key={pageIndex}>
            {page.items.map((item, index) => {
              const isLastItem = pageIndex === data.pages.length - 1 && index === page.items.length - 1;
              return (
                <EventCard
                  event={item}
                  key={item.id}
                  ref={isLastItem ? lastItemRef : noop}
                  currentUserId={user?.user_id}
                  mode="normal"
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </Block>
  );
}
