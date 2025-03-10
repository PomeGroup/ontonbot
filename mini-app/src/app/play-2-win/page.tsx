"use client";

import BottomNavigation from "@/components/BottomNavigation";
import Typography from "@/components/Typography";
import { Page } from "konsta/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { BiDollar } from "react-icons/bi";
import CustomCard from "../_components/atoms/cards/CustomCard";
import PrizeCupIcon from "../_components/icons/prize-cup";

const PlayToWin: React.FC = () => {
  return (
    <Page>
      <div className="p-4 flex flex-col gap-6 mb-12">
        <Typography
          className="text-center"
          variant="title2"
        >
          Play to Win
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Link
              key={i}
              href={"/play-2-win/wow"}
            >
              <CustomCard defaultPadding>
                <div className="flex flex-col gap-3">
                  <Image
                    src="https://s3-alpha-sig.figma.com/img/1e4c/449e/2570818513b584eeb180eaadace966f7?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EGzjtweOC4U3JDfHqwxE6wHMlvKOqJ2XFAjHkDw58Jv8kYGB-koNwkXSlevC8V0DKBalxTvtaEaja0pCtOXNe5lQaVudFzHgfkJzJdug4UcXI~0u1BSLkJ31UE0JXqEVqq2sl5NXH5WG8IL0l8Pm5SPRsbMT3FflSLqO~~MP8RE3lhXjr7L2VD9upfsb5o25iu7L2aSXY2AUfnlSF1n~rfy576w0xHVppHsJQDgHOq2l0zEVhXSjAkYFK9rJPeL7YdTElO2ODk-2awveH6P1Xu75spLEhyTus4mVv9xiTa8HpIHnW8C0YvZaCqENRGYJ0FFWxPqzzXHMAgzkbActVQ__"
                    width={120}
                    height={120}
                    className="mx-auto rounded-md"
                    alt="game card"
                  />
                  <div className="flex flex-col gap-2">
                    <Typography
                      variant="caption2"
                      truncate
                    >
                      +1200 joined
                    </Typography>

                    <div className="flex flex-col gap-0.5">
                      <Typography
                        variant="callout"
                        truncate
                      >
                        This is a title
                      </Typography>
                      <div className="flex items-center gap-0.5">
                        <Image
                          src="https://s3-alpha-sig.figma.com/img/1e4c/449e/2570818513b584eeb180eaadace966f7?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EGzjtweOC4U3JDfHqwxE6wHMlvKOqJ2XFAjHkDw58Jv8kYGB-koNwkXSlevC8V0DKBalxTvtaEaja0pCtOXNe5lQaVudFzHgfkJzJdug4UcXI~0u1BSLkJ31UE0JXqEVqq2sl5NXH5WG8IL0l8Pm5SPRsbMT3FflSLqO~~MP8RE3lhXjr7L2VD9upfsb5o25iu7L2aSXY2AUfnlSF1n~rfy576w0xHVppHsJQDgHOq2l0zEVhXSjAkYFK9rJPeL7YdTElO2ODk-2awveH6P1Xu75spLEhyTus4mVv9xiTa8HpIHnW8C0YvZaCqENRGYJ0FFWxPqzzXHMAgzkbActVQ__"
                          width={16}
                          height={16}
                          alt="organizer image"
                          className="rounded-full"
                        />
                        <Typography
                          variant="footnote"
                          className="text-brand-link"
                          truncate
                        >
                          akjshdflksadjhfljsadkhfjlasdhf ljkhasdfkj hasdkjfh asdkf
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <PrizeCupIcon />
                        <Typography
                          variant="subheadline2"
                          className="flex items-center"
                        >
                          <span>100</span>
                          <span>
                            <BiDollar className="text-brand-muted -mt-0.5" />
                          </span>
                        </Typography>
                      </div>
                      <Typography
                        className="bg-brand-muted text-brand-light rounded px-1 py-0.25"
                        variant="caption2"
                      >
                        10 TON
                      </Typography>
                    </div>
                  </div>
                </div>
              </CustomCard>
            </Link>
          ))}
        </div>
      </div>
      <BottomNavigation active="Play2Win" />
    </Page>
  );
};

export default PlayToWin;
