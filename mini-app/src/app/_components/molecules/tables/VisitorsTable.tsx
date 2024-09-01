"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useIntersection } from "@mantine/hooks";
import { Wallet2 } from "lucide-react";
import React, { FC, Fragment, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { FaUserCircle } from "react-icons/fa";
import { FiAtSign } from "react-icons/fi";
import { BsFillPersonLinesFill } from "react-icons/bs";
import VariantBadge from "@/app/_components/checkInGuest/VariantBadge";

interface VisitorsTableProps {
  event_uuid: string;
}

const VisitorsTable: FC<VisitorsTableProps> = ({ event_uuid }) => {
  const webApp = useWebApp();

  const { fetchNextPage, data, hasNextPage, isFetchingNextPage } =
    trpc.visitors.getAll.useInfiniteQuery(
      {
        event_uuid,
        init_data: webApp?.initData || "",

        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        initialCursor: 0,
        enabled: Boolean(webApp?.initData) && Boolean(event_uuid),
        retry: false,
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
      <div className="w-full">
        <div className="flex flex-col">
          <div className="flex w-full p-4 bg-gray-700">
            <div className="inline-flex items-center ">
              <BsFillPersonLinesFill className="mr-2" />
              Guests
            </div>
          </div>

          {flatData.map((visitor, index) => {
            if (!visitor) {
              return null;
            }

            return (
              <Fragment key={index}>
                <div
                  className="flex w-full p-4 text-sm border-b border-gray-700"
                  ref={index === flatData.length - 1 ? ref : null}
                >
                  <div className="flex-1 truncate text-gray-100">
                    <div className="inline-flex items-center">
                      <FaUserCircle className="mr-2" />
                      {`${visitor?.first_name} ${visitor?.last_name}`}
                    </div>
                    <br />
                    <a
                      className="flex-1 truncate text-xs py-0 italic cursor-pointer"
                      onClick={() => {
                        if (visitor?.username) {
                          webApp?.openTelegramLink(
                            `https://t.me/${visitor?.username}`
                          );
                        }
                      }}
                    >
                      <div className="inline-flex items-center py-0 text-gray-400">
                        <FiAtSign className="ml-5 mr-0" />
                        {visitor?.username
                          ? `${visitor?.username}`
                          : "No Username"}
                      </div>
                    </a>
                  </div>

                  <div className="flex-1 flex justify-end items-center">
                    {visitor.has_ticket === false ? (
                      <div
                        className="cursor-pointer"
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
                            <div className="inline-flex items-center py-0 text-gray-300">
                              <Wallet2
                                className="mr-2"
                                width={12}
                                height={12}
                              />{" "}
                              open wallet
                            </div>
                          </>
                        ) : (
                          <>No Wallet</>
                        )}
                      </div>
                    ) : (
                      <VariantBadge status={visitor?.ticket_status || ""} />
                    )}
                  </div>
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
