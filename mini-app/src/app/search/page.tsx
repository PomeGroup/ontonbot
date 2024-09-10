"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
} from "react";
import Image from "next/image";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { trpc } from "@/app/_trpc/client";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import TabTriggers from "@/app/_components/SearchBar/TabTriggers";
import useSearchEventsStore from "@/zustand/searchEventsInputZod";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { useSearchParams } from "next/navigation";
import applyTabFilter from "@/app/_components/SearchBar/applyTabFilter";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import { Separator } from "@/components/ui/separator";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const LIMIT = 5;

const Search: React.FC = () => {
  useWithBackButton({
    whereTo: "/",
  });

  const searchStore = useSearchEventsStore();
  const searchParams = useSearchParams();
  const { searchInput, setSearchInput, setFilter, setOffset } = searchStore;
  const [finalSearchInput, setFinalSearchInput] = useState(
    searchEventsInputZod.parse(searchInput)
  );
  const webApp = useWebApp();
  const { authorized, isLoading: useAuthLoading, role: userRole } = useAuth();
  const UserId = authorized ? webApp?.initDataUnsafe?.user?.id : 0;

  const [results, setResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [observingTab, setObservingTab] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const tabParam = searchParams.get("tab") || "All";
  const [tabValue, setTabValue] = useState(tabParam);
  const swiperRef = useRef<any>(null);
  const scrollableDivRef = useRef<HTMLDivElement | null>(null);
  const tabItems = [
    { value: "All", label: "All" },
    {
      value: "Upcoming",
      label: "Upcoming",
      borderClass: "border-x-2 border-x-gray-600",
    },
    { value: "Past", label: "Past" },
    {
      value: "OnGoing",
      label: "OnGoing",
      borderClass: "border-x-2 border-x-gray-600",
    },
    { value: "MyEvents", label: "My Events" },
  ];

  const {
    isLoading: isLoadingSearchResults,
    isFetching: isFetchingSearchResults,
    refetch,
  } = trpc.events.getEventsWithFilters.useQuery(finalSearchInput, {
    enabled: initialFetchDone,
    // enabled: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      if (!initialFetchDone || searchInput.offset === 0) {
        setResults([]);
      }
      setResults((prev) => [...prev, ...(data.data || [])]);
      setHasMore(data?.data?.length === LIMIT);
    },
  });

  const loadMoreResults = useCallback(() => {
    if (hasMore && !isFetchingSearchResults) {
      setOffset(searchInput?.offset ? searchInput?.offset + LIMIT : LIMIT);
    }
  }, [hasMore, isFetchingSearchResults, searchInput.offset, setOffset]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && currentTabIndex === observingTab) {
        loadMoreResults();
      }
    });

    const lastElement = document.querySelector(
      `.last-event-card-${observingTab}`
    );
    if (lastElement) {
      observerRef.current.observe(lastElement);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [results, currentTabIndex, observingTab]);

  useEffect(() => {
    if (!initialFetchDone) {
      refetch().then(() => {
        setInitialFetchDone(true);
        setSearchInput({
          offset: searchInput?.offset ? searchInput?.offset + LIMIT : 0,
        });
      });
    }
  }, [refetch, initialFetchDone, searchInput.offset, setSearchInput]);

  useEffect(() => {
    //resetFilters();
    setOffset(0);

    // applyTabFilter(tabValue , searchInput.sortBy);
    applyTabFilter(tabValue, UserId);

    setResults([]);
  }, [tabValue, setFilter, UserId]);

  useEffect(() => {
    setFinalSearchInput(searchEventsInputZod.parse(searchInput));
  }, [searchStore]);
  useEffect(() => {
    const handleScroll = () => {
      if (scrollableDivRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableDivRef.current;
        // Check if user has scrolled to the bottom
        if (scrollTop + clientHeight >= scrollHeight - 50) {
          loadMoreResults();
        }
      }
    };

    const scrollableDiv = scrollableDivRef.current;

    if (scrollableDiv) {
      scrollableDiv.addEventListener("scroll", handleScroll);
    }

    // Cleanup event listener on component unmount
    return () => {
      if (scrollableDiv) {
        scrollableDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [loadMoreResults]);
  const handleSlideChange = (swiper: any) => {
    const activeIndex = swiper.activeIndex;
    const newTab = tabItems[activeIndex]?.value || "All";
    setTabValue(newTab);
    setCurrentTabIndex(activeIndex);
    setOffset(0);
    setResults([]);
    setObservingTab(activeIndex);

    // Reset scroll to top
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
      <div className="flex flex-col h-screen">

        <div className="sticky top-0 z-50 w-full bg-[#1C1C1E] pb-1">
          <SearchBar
              includeQueryParam={true}
              showFilterTags={true}
              onUpdateResults={setResults}
              offset={searchInput.offset}
              setOffset={(newOffset) => setSearchInput({offset: newOffset})}
              searchParamsParsed={searchInput}
              setSearchParamsParsed={setSearchInput}
              refetch={refetch}
              setFinalSearchInput={setFinalSearchInput}
              applyTabFilter={applyTabFilter}
              tabValue={tabValue}
              userRole={authorized ? userRole : "user"}
          />
        </div>
        <Separator className="my-0 bg-gray-700"/>
        <TabTriggers
            tabs={tabItems}
            setTabValue={setTabValue}
            tabValue={tabValue}
            swiperRef={swiperRef}
        />

        <div ref={scrollableDivRef} className="overflow-y-auto  flex-grow">
          <Swiper
              onSlideChange={handleSlideChange}
              slidesPerView={1}
              spaceBetween={30}
              pagination={{clickable: true}}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
          >
            {tabItems.map((tab, index) => (
                <SwiperSlide key={tab.value}>

                  <ScrollArea
                      key={`${tab.value}-div`}
                      className="  w-full   whitespace-nowrap border-0 min-h-[calc(100vh-11rem)]"

                  >

                    {!isLoadingSearchResults &&
                        !isFetchingSearchResults &&
                        results.length === 0 && (
                            <div
                                className="flex flex-col items-center justify-center min-h-screen  text-center space-y-4">
                              <div>
                                <Image
                                    src={"/template-images/no-search-result.gif"}
                                    alt={"No search results found"}
                                    width={180}
                                    height={180}
                                />
                              </div>
                              <div className="text-gray-500 max-w-md">
                                No Events were found <br/>matching your Search.
                              </div>
                            </div>
                        )}
                    <div className="pt-4 ">
                      {isLoadingSearchResults && results.length === 0 ? (
                          <div className="flex flex-col gap-2">
                            {Array.from({length: LIMIT}).map((_, index) => (
                                <EventCardSkeleton
                                    key={index}
                                    mode="normal"
                                />
                            ))}
                          </div>
                      ) : (
                          <>
                            {results.map((event, eventIndex) => (
                                <div
                                    key={event.event_uuid}
                                    className={
                                      eventIndex === results.length - 2 ||
                                      eventIndex === results.length - 1
                                          ? `last-event-card-${index}`
                                          : ""
                                    }
                                >
                                  <EventCard
                                      event={event}
                                      currentUserId={UserId}
                                  />
                                </div>
                            ))}
                          </>
                      )}

                      {isFetchingSearchResults &&
                          hasMore &&
                          results.length !== 0 && (
                              <div className="text-center py-4 pb-5 w-full">
                                <div className="loader">Loading results...</div>
                              </div>
                          )}
                      <div className="text-center py-4 pb-5 ">
                        <div className="loader"> &nbsp; </div>
                      </div>
                    </div>
                    <ScrollBar orientation="horizontal"/>
                  </ScrollArea>
                </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
  );
};

export default Search;
