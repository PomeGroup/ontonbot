import { Pagination } from "swiper/modules";

import type { Meta, StoryObj } from "@storybook/react";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";

type SlidersProps = {};

const Sliders = ({}: SlidersProps) => {
  return (
    <div className="max-w-64 overflow-hidden">
      <Swiper
        slidesPerView="auto"
        className="!-mx-4 !pe-8"
        spaceBetween={12}
        pagination
        autoHeight
        modules={[Pagination]}
        wrapperClass="swiper-wrapper pb-8 px-4"
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <SwiperSlide
            className="!w-[220px] !h-[220px]"
            key={idx}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
              }}
              className="flex items-center justify-center font-bold text-2xl"
            >
              {idx}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const meta: Meta<typeof Sliders> = {
  component: Sliders,
};

export default meta;
type Story = StoryObj<typeof Sliders>;

export const Primary: Story = {
  args: {},
};
