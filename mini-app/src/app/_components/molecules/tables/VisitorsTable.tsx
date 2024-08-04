"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useIntersection } from "@mantine/hooks";
import { Wallet2 } from "lucide-react";
import { FC, Fragment, useEffect, useRef } from "react";

interface VisitorsTableProps {
  event_uuid: string;
}

const VisitorsTable: FC<VisitorsTableProps> = ({ event_uuid }) => {
  const webApp = useWebApp();

  const { fetchNextPage, data, hasNextPage, isFetchingNextPage } =
    trpc.visitors.getAll.useInfiniteQuery(
      {
        event_uuid,
        initData: webApp?.initData,
        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        initialCursor: 0,
      }
    );

  const lastItemRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastItemRef.current,
    threshold: 0.2,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const flatData =
    data?.pages?.flatMap((page) => page?.visitorsWithDynamicFields) ?? [];

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="">
        <div
          className="text-sm sm:text-md md:text-lg gap-4 p-4"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr minmax(auto, max-content)",
          }}
        >
          <div className="font-bold">Full Name</div>
          <div className="font-bold">Username</div>
          <div className="font-bold text-end">Wallet</div>
          {flatData.map((visitor, index) => {
            if (!visitor) {
              return null;
            }

            return (
              <Fragment key={index}>
                <div
                  ref={index === flatData.length - 1 ? ref : null}
                  className="truncate"
                >{`${visitor?.first_name} ${visitor?.last_name}`}</div>
                <div
                  className="truncate cursor-pointer"
                  onClick={() => {
                    if (visitor?.username) {
                      webApp?.openTelegramLink(
                        `https://t.me/${visitor?.username}`
                      );
                    }
                  }}
                >
                  {visitor?.username ? (
                    <p className="underline">@{visitor?.username}</p>
                  ) : (
                    <>No Username</>
                  )}
                </div>
                <div
                  className="flex justify-end items-center cursor-pointer"
                  onClick={() => {
                    if (visitor?.wallet_address) {
                      webApp?.openLink(
                        `https://tonviewer.com/${visitor?.wallet_address}`
                      );
                    }
                  }}
                >
                  {visitor?.wallet_address ? (
                    <>
                      Open
                      <Wallet2
                        className="ml-1"
                        width={12}
                        height={12}
                      />
                    </>
                  ) : (
                    <>No Wallet</>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisitorsTable;
