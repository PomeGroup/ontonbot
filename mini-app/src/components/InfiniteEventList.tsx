import EventCard from "@/app/_components/EventCard/EventCard";
import useWebApp from "@/hooks/useWebApp";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { TRPCClientErrorBase } from "@trpc/react-query";
import { UseTRPCInfiniteQueryResult } from "@trpc/react-query/shared";
import { DefaultErrorShape } from "@trpc/server";
import { Block } from "konsta/react";
import { noop } from "lodash";
import { Fragment, useCallback, useRef } from "react";
import Typography from "./Typography";

interface Props {
  title: string;
  infiniteApi: UseTRPCInfiniteQueryResult<
    {
      items: { eventsData: any[]; rowsCount: number };
      nextCursor: number | null;
    },
    TRPCClientErrorBase<DefaultErrorShape>
  >;
}

export default function InfiniteEventList({ title, infiniteApi }: Props) {
  const webApp = useWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, status } = infiniteApi;

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

  if (status === "loading") return null;
  if (status === "error") return <p>Error fetching data</p>;

  const hasItems = data?.pages[0]?.items?.eventsData.length > 0;
  return (
    <Block
      margin="0"
      className="flex-wrap bg-[rgba(239,239,244,1)] pt-8 pb-16 min-h-screen"
    >
      <Typography
        variant="title3"
        bold
        className="mb-6"
      >
        {title}
      </Typography>
      <div className="flex flex-col w-full gap-2">
        {hasItems ? (
          data?.pages.map((page, pageIndex) => (
            <Fragment key={pageIndex}>
              {page.items.eventsData.map((item, index) => {
                const isLastItem = pageIndex === data.pages.length - 1 && index === page.items.eventsData.length - 1;
                return (
                  <div
                    key={item.id}
                    ref={isLastItem ? lastItemRef : noop}
                  >
                    <EventCard
                      event={item}
                      currentUserId={userId}
                    />
                  </div>
                );
              })}
            </Fragment>
          ))
        ) : (
          <div className="flex justify-center flex-col w-full">
            <DotLottieReact
              loop
              autoplay
              src="/crying-duck.lottie"
              height={180}
              width={180}
              className="mx-auto w-[180px] mt-[68px] mb-6"
            />
            <div className="text-gray-500 text-center text-lg font-bold">No Events at this time.</div>
          </div>
        )}
      </div>
    </Block>
  );
}
