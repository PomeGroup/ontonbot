import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useIntersection } from "@mantine/hooks";
import { Wallet2 } from "lucide-react";
import React, {
  FC,
  Fragment,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiAtSign } from "react-icons/fi";
import VariantBadge from "@/app/_components/checkInGuest/VariantBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaCloudDownloadAlt } from "react-icons/fa";
import Image from "next/image";
type Visitor = {
  user_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  wallet_address: string | null;
  created_at: string | null;
  has_ticket: boolean;
  ticket_status: string | null;
  ticket_id: number | null;
};

type VisitorsDataResponse = {
  visitorsWithDynamicFields: any;
  moreRecordsAvailable: boolean;
  visitorsData: Visitor[];
  nextCursor: number | null;
  event: {
    event_id: number;
    event_uuid: string;
    ticketToCheckIn: boolean;
    title: string;
  };
};

interface VisitorsTableProps {
  event_uuid: string;
  handleVisitorsExport: () => void;
  setNeedRefresh: (data: any) => void;
  needRefresh: boolean;
}
const VisitorsTable: FC<VisitorsTableProps> = ({ event_uuid, handleVisitorsExport, setNeedRefresh, needRefresh }) => {
  const webApp = useWebApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ waitingFoeDebaunce, setWaitingForDebaunc ] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false); // State to control the delay message
  const [isTyping, setIsTyping] = useState(false);
  const [firstLoad, setFirstLoad] = useState(false);
  const { fetchNextPage, data, hasNextPage, isFetchingNextPage, refetch: refetchVisitors } =
      trpc.visitors.getAll.useInfiniteQuery(
          {
            event_uuid,
            init_data: webApp?.initData || "",
            limit: 50,
            dynamic_fields: false,
            search: debouncedSearchQuery,
          },
          {
            getNextPageParam: (lastPage) => lastPage?.nextCursor || null,
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
    if (needRefresh) {
      refetchVisitors().then(() => {
        setNeedRefresh(false);
        setFirstLoad(true);
      });
    }
  }, [needRefresh]);

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Debouncing search query
  useEffect(() => {
    if (waitingFoeDebaunce) {
      return;
    }
    setWaitingForDebaunc(true);
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay
    return () => {
      clearTimeout(handler);
      setWaitingForDebaunc(false);
    };
  }, [searchQuery]);

  // Flatten all pages to include newly fetched data
  // @ts-ignore
  const flatData: Visitor[] = data?.pages.flatMap((page) => page?.visitorsData) || [];

  // Check the visitor count on the first page
  const firstPageVisitorCount = data?.pages[0]?.visitorsData.length || 0;

  // Memoized filtered visitors
  const filteredVisitors = useMemo(() => {
    if (!flatData) return [];
    return flatData.filter((visitor) => {
      const matchesSearch = visitor?.username
              ?.toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()) ||
          `${visitor?.first_name} ${visitor?.last_name}`
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Waiting" && visitor.ticket_status === "UNUSED") ||
          (statusFilter === "Checked-In" && visitor.ticket_status === "USED");

      return matchesSearch && matchesStatus;
    });
  }, [flatData, debouncedSearchQuery, statusFilter]);
  // Check if there are no events after filtering
  const noEvents =
      !isFetchingNextPage &&
      debouncedSearchQuery.length > 0 &&
      filteredVisitors.length === 0 &&
      waitingFoeDebaunce;
  // Check if there are no events after filtering and display after 5 seconds
  // Check if there are no events after filtering and display immediately if there are no results on load
  useEffect(() => {
    console.log("isFetchingNextPage:", isFetchingNextPage);
    console.log("debouncedSearchQuery:", debouncedSearchQuery);
    console.log("filteredVisitors Length:", filteredVisitors.length);
    if(isFetchingNextPage && !firstLoad) {
        setShowNoResults(true);
    }
    else if (!isFetchingNextPage && !isTyping && debouncedSearchQuery.length === 0 && filteredVisitors.length === 0) {
      setShowNoResults(true); // Show immediately if no results on page load
    } else if (!isFetchingNextPage && !isTyping && debouncedSearchQuery.length > 0 && filteredVisitors.length === 0) {
      const timer = setTimeout(() => {
        setShowNoResults(true); // Show message after 5 seconds when searching
      }, 5000); // 5-second delay for showing no results
      return () => clearTimeout(timer); // Clear the timer if the component unmounts or search changes
    } else {
      setShowNoResults(false); // Reset the message if results are found or search changes
    }
  }, [debouncedSearchQuery, filteredVisitors, isFetchingNextPage, isTyping]);
  return (
    <div className="mt-0 overflow-x-auto">
      <div className="w-full p-0">
        {/* Search Bar */}
        <Input
          type="text"
          placeholder="Search by username or name"
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            if (value.length >= 3) {
              setDebouncedSearchQuery(value);
            }
          }}
          className="mb-4 mt-4"
        />


          <div className="flex flex-col py-0">
            <div className="flex w-full p-0 border-b-gray-800 border-b-2">
              <div className="inline-flex py-0 items-center text-lg w-full">
                {data?.pages[0]?.event.ticketToCheckIn ? (
                  <Tabs
                    defaultValue="All"
                    className="bg-transparent px-0 py-0"
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <TabsList className="bg-transparent px-0">
                      <TabsTrigger
                        className="px-4 py-0 text-gray-500 data-[state=active]:text-gray-100 data-[state=active]:font-bold"
                        value="All"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        className="px-4 py-0 border-x-2 border-x-gray-600 rounded-none text-gray-500 data-[state=active]:text-gray-100 data-[state=active]:font-bold"
                        value="Waiting"
                      >
                        Waiting
                      </TabsTrigger>
                      <TabsTrigger
                        className="px-4 py-0 text-gray-500 data-[state=active]:text-gray-100 data-[state=active]:font-bold"
                        value="Checked-In"
                      >
                        Checked-In
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                ) : (
                  "Guests"
                )}
                {/* Conditionally render the Download All button */}
                {firstPageVisitorCount > 1 && (
                  <Button
                    variant="link"
                    className="ml-auto flex items-center text-xs py-0 text-gray-300 px-0 no-underline hover:no-underline"
                    onClick={handleVisitorsExport}
                  >
                    <FaCloudDownloadAlt className="mr-2" /> Download All
                  </Button>
                )}
              </div>
            </div>
            {(showNoResults  ) ? (
                    <div className="flex flex-col  animate-fade items-center justify-center  mt-12 text-center space-y-4  ">
                      <div>
                        <Image
                            src={"/template-images/no-guest.png"}
                            alt={"No search results found"}
                            width={180}
                            height={180}
                        />
                      </div>
                      <div className="text-gray-500 max-w-md">
                        Nothing Was Found <br/>
                        Try to enter other keywords
                      </div>
                    </div>
                )
               :
                filteredVisitors.map((visitor, index) => {
              if (!visitor) {
                return null;
              }

              return (
                <Fragment key={(visitor.user_id || index) + Math.random()}>
                  <div
                    className="flex w-full p-4 text-sm border-b border-gray-700"
                    ref={index === filteredVisitors.length - 1 ? ref : null}
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
                      {!visitor.has_ticket ? (
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
                      ) : visitor?.ticket_id !== Number(needRefresh) &&
                        visitor?.ticket_id ? (
                        <VariantBadge
                          key={visitor?.created_at?.toString()}
                          status={visitor?.ticket_status || ""}
                        />
                      ) : (
                        <VariantBadge
                          key={visitor?.created_at?.toString()}
                          status={"USED"}
                        />
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