"use client";

import BottomNavigation from "@/components/BottomNavigation";
import Typography from "@/components/Typography";
import { Skeleton } from "@mui/material";
import { Page } from "konsta/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import "swiper/css";
import CustomCard from "../_components/atoms/cards/CustomCard";
import CustomButton from "../_components/Button/CustomButton";
import DataStatus from "../_components/molecules/alerts/DataStatus";
import { trpc } from "../_trpc/client";

const PlayToWin: React.FC = () => {
  const router = useRouter();
  const tournomants = trpc.tournaments.getTournaments.useInfiniteQuery(
    {
      limit: 50,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <Page>
      <div className="p-4 flex flex-col gap-2 mb-12">
        {/* <Typography variant="title2">Featured Contests</Typography>
        <div>
          <Swiper
            slidesPerView="auto"
            className="-mx-3"
            spaceBetween={12}
            pagination={{ clickable: true }}
            autoHeight
            modules={[Pagination]}
            wrapperClass="swiper-wrapper pb-3 px-4"
          >
            <SwiperSlide className="!w-[220px]">
              <Image
                src="https://s3-alpha-sig.figma.com/img/1e4c/449e/2570818513b584eeb180eaadace966f7?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EGzjtweOC4U3JDfHqwxE6wHMlvKOqJ2XFAjHkDw58Jv8kYGB-koNwkXSlevC8V0DKBalxTvtaEaja0pCtOXNe5lQaVudFzHgfkJzJdug4UcXI~0u1BSLkJ31UE0JXqEVqq2sl5NXH5WG8IL0l8Pm5SPRsbMT3FflSLqO~~MP8RE3lhXjr7L2VD9upfsb5o25iu7L2aSXY2AUfnlSF1n~rfy576w0xHVppHsJQDgHOq2l0zEVhXSjAkYFK9rJPeL7YdTElO2ODk-2awveH6P1Xu75spLEhyTus4mVv9xiTa8HpIHnW8C0YvZaCqENRGYJ0FFWxPqzzXHMAgzkbActVQ__"
                width={220}
                height={220}
                className="w-[220px] rounded-md"
                alt="game card"
              />
            </SwiperSlide>
            <SwiperSlide className="w-[220px]">
              <Image
                src="https://s3-alpha-sig.figma.com/img/1e4c/449e/2570818513b584eeb180eaadace966f7?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EGzjtweOC4U3JDfHqwxE6wHMlvKOqJ2XFAjHkDw58Jv8kYGB-koNwkXSlevC8V0DKBalxTvtaEaja0pCtOXNe5lQaVudFzHgfkJzJdug4UcXI~0u1BSLkJ31UE0JXqEVqq2sl5NXH5WG8IL0l8Pm5SPRsbMT3FflSLqO~~MP8RE3lhXjr7L2VD9upfsb5o25iu7L2aSXY2AUfnlSF1n~rfy576w0xHVppHsJQDgHOq2l0zEVhXSjAkYFK9rJPeL7YdTElO2ODk-2awveH6P1Xu75spLEhyTus4mVv9xiTa8HpIHnW8C0YvZaCqENRGYJ0FFWxPqzzXHMAgzkbActVQ__"
                width={220}
                height={220}
                className="w-[220px] rounded-md"
                alt="game card"
              />
            </SwiperSlide>
          </Swiper>
        </div> */}

        <Typography variant="title2">Discover</Typography>
        <div className="grid grid-cols-2 gap-4">
          {tournomants.isError && (
            <CustomCard
              className="col-span-2"
              defaultPadding
            >
              <DataStatus
                status="searching"
                title={`Error${tournomants.error instanceof Error ? `: ${tournomants.error.name}` : ""}`}
                description={tournomants.error instanceof Error ? tournomants.error.message : "Error loading tournaments."}
              />
            </CustomCard>
          )}
          {tournomants.isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
                >
                  <Skeleton
                    variant="rectangular"
                    width={120}
                    height={120}
                    className="rounded-md"
                  />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={36}
                    className="rounded-md mt-2"
                  />
                </div>
              ))
            : tournomants.data?.pages.map((page) =>
                page.tournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/play-2-win/${tournament.id}`}
                  >
                    <CustomCard defaultPadding>
                      <div className="flex flex-col gap-3">
                        <Image
                          src={tournament.imageUrl}
                          width={120}
                          height={120}
                          className="mx-auto rounded-md"
                          alt="game card"
                        />
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-0.5">
                            <Typography
                              variant="callout"
                              truncate
                            >
                              {tournament.name}
                            </Typography>
                          </div>
                          <div className="flex items-center justify-between">
                            <CustomButton
                              variant="outline"
                              size="md"
                              onClick={() => {
                                router.push(`/play-2-win/${tournament.id}`);
                              }}
                            >
                              Play
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    </CustomCard>
                  </Link>
                ))
              )}
        </div>
      </div>
      <BottomNavigation active="Play2Win" />
    </Page>
  );
};

export default PlayToWin;
