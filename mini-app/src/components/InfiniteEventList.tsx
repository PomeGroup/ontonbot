import { UseTRPCInfiniteQueryResult } from "@trpc/react-query/shared";
import { Block } from "konsta/react";
import { Fragment, useCallback, useRef } from "react";
import Typography from "./Typography";
import EventCard from "@/app/_components/EventCard/EventCard";
import { noop } from "lodash";
import { TRPCClientErrorBase } from "@trpc/react-query";
import { DefaultErrorShape } from "@trpc/server";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import useWebApp from '@/hooks/useWebApp';

interface Props {
  title: string;
  infiniteApi: UseTRPCInfiniteQueryResult<
    {
      items: any[];
      nextCursor: number | null;
    },
    TRPCClientErrorBase<DefaultErrorShape>
  >;
}

export default function InfiniteEventList({ title, infiniteApi }: Props) {
  const webApp = useWebApp()
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

  const hasItems = data?.pages[0]?.items?.length > 0;
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
      <div className="flex flex-col w-full">
        {hasItems ? (
          data?.pages.map((page, pageIndex) => (
            <Fragment key={pageIndex}>
              {page.items.map((item, index) => {
                const isLastItem = pageIndex === data.pages.length - 1 && index === page.items.length - 1;
                return (
                  <EventCard
                    event={item}
                    key={item.id}
                    ref={isLastItem ? lastItemRef : noop}
                    currentUserId={userId}

                  />
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
