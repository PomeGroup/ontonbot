"use client";
import React, { useEffect, useRef, useState } from "react";
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
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Block } from "konsta/react";
import { useTheme } from "next-themes";

/** The maximum number of items per page */
const LIMIT = 5;

const Search: React.FC = () => {
  useWithBackButton({ whereTo: "/" });
  const { setTheme } = useTheme();

  const searchStore = useSearchEventsStore();
  const searchParams = useSearchParams();
  const { searchInput } = searchStore;

  // We no longer track offset; we'll rely on a cursor-based approach
  // that is handled automatically by the infiniteQuery below.
  const [finalSearchInput, setFinalSearchInput] = useState(searchEventsInputZod.parse(searchInput));

  const webApp = useWebApp();
  const { authorized, role: userRole } = useAuth();
  const UserId = authorized ? webApp?.initDataUnsafe?.user?.id : 0;

  // We track the active tab separately
  const tabParam = searchParams.get("tab") || "All";
  const [tabValue, setTabValue] = useState(tabParam);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [observingTab, setObservingTab] = useState(0);

  // For the infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const swiperRef = useRef<any>(null);
  const scrollableDivRef = useRef<HTMLDivElement | null>(null);

  // Example tab items
  const tabItems = [
    { value: "All", label: "All" },
    { value: "Upcoming", label: "Upcoming", borderClass: "border-x-2 border-x-gray-600" },
    { value: "Past", label: "Past" },
    { value: "OnGoing", label: "Ongoing", borderClass: "border-x-2 border-x-gray-600" },
  ];

  /**
   * 1) Use Infinite Query instead of a normal useQuery
   * 2) We pass in our search/filter input
   * 3) getNextPageParam looks at `lastPage.nextCursor`
   */
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
      {
        ...finalSearchInput,
        limit: LIMIT,
        // We can add more fields if needed:
        // filter: finalSearchInput.filter
        // search: finalSearchInput.search
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        keepPreviousData: true,
        // If you only want to fetch once "initial fetch done," you can
        // conditionally enable or pass `enabled: true/false`
      }
    );

  // Combine all pages of data into one array
  const allEvents = data?.pages.flatMap((page) => page.items) ?? [];

  /**
   * IntersectionObserver that triggers fetchNextPage()
   * whenever the user scrolls near the bottom
   */
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && currentTabIndex === observingTab && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    // Mark the last event in the UI with a unique class so we can attach observer
    const lastElement = document.querySelector(`.last-event-card-${observingTab}`);
    if (lastElement) {
      observerRef.current.observe(lastElement);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [allEvents, currentTabIndex, observingTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * If user changes the tab, apply the tab filter,
   * reset the entire infinite query by calling refetch,
   * and forcibly scroll to top.
   */
  const handleSlideChange = (swiper: any) => {
    const activeIndex = swiper.activeIndex;
    const newTab = tabItems[activeIndex]?.value || "All";
    setTabValue(newTab);
    setCurrentTabIndex(activeIndex);
    setObservingTab(activeIndex);

    applyTabFilter(newTab, UserId);

    // If you want a "fresh" start for the new tab, you can:
    // 1) Update finalSearchInput with new filter
    // 2) refetch() with the new data, letting TRQ do a new fetch
    setFinalSearchInput((prev) => ({
      ...prev,
      // maybe reset the cursor if you store it in state
      // but we rely on TRQ to handle from scratch
    }));

    // Scroll to top
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Listen for changes in your zustand store; if `searchInput` changes,
   * update finalSearchInput so the query re-runs with the new filters.
   */
  useEffect(() => {
    setFinalSearchInput(searchEventsInputZod.parse(searchInput));
  }, [searchInput]);

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <Block className="!my-2">
      <div className="flex flex-col">
        {/* Sticky top bar with SearchBar & TabTriggers */}
        <div className="sticky top-0 z-50 w-full pb-1 bg-white pt-2">
          <SearchBar
            includeQueryParam={true}
            tabValue={tabValue}
            userRole={authorized ? userRole : "user"}
            showFilterTags={true}
            refetch={refetch}
            setFinalSearchInput={setFinalSearchInput}
            applyTabFilter={applyTabFilter}
          />

          <TabTriggers
            tabs={tabItems}
            setTabValue={setTabValue}
            tabValue={tabValue}
            swiperRef={swiperRef}
          />
        </div>

        {/* Scrollable area containing the Swiper slides */}
        <div
          ref={scrollableDivRef}
          className="overflow-y-auto flex-grow"
        >
          <Swiper
            onSlideChange={handleSlideChange}
            slidesPerView={1}
            spaceBetween={30}
            pagination={{ clickable: true }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {tabItems.map((tab, index) => (
              <SwiperSlide key={tab.value}>
                <ScrollArea
                  key={`${tab.value}-div`}
                  className="w-full whitespace-nowrap border-0 min-h-[calc(100vh-11rem)]"
                >
                  {/* Show skeleton if loading and no data */}
                  {isLoading && allEvents.length === 0 ? (
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: LIMIT }).map((_, i) => (
                        <EventCardSkeleton
                          key={i}
                          mode="normal"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Show no results if done loading, no data */}
                      {!isLoading && !isFetchingNextPage && allEvents.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
                          <Image
                            src="/template-images/no-search-result.gif"
                            alt="No search results found"
                            width={180}
                            height={180}
                          />
                          <div className="text-gray-500 max-w-md">
                            No Events were found
                            <br />
                            matching your Search.
                          </div>
                        </div>
                      )}

                      {/* Otherwise, render the events */}
                      {allEvents.map((event, eventIndex) => {
                        // Mark the last 1-2 events with a special class for IntersectionObserver
                        const isNearEnd = eventIndex === allEvents.length - 1 || eventIndex === allEvents.length - 2;

                        return (
                          <div
                            key={event.eventId}
                            className={isNearEnd ? `last-event-card-${index}` : ""}
                          >
                            <EventCard
                              event={event}
                              currentUserId={UserId}
                            />
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* "Loading more" indicator, if we're currently fetching the next page */}
                  {isFetchingNextPage && hasNextPage && allEvents.length !== 0 && (
                    <div className="text-center py-4 pb-5 w-full">
                      <div className="loader">Loading results...</div>
                    </div>
                  )}

                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </Block>
  );
};

export default Search;
