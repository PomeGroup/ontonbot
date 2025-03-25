"use client";
import React, { useEffect, useRef, useState } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

type CustomSwiperProps = {
  children: React.ReactNode | React.ReactNode[];
  containerClassName?: string;
};

const CustomSwiper: React.FC<CustomSwiperProps> = ({ children, containerClassName = "!-mx-4 !pe-8" }) => {
  const paginationRef = useRef<HTMLDivElement>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paginationRef.current && !paginationEl) {
      setPaginationEl(paginationRef.current);
    }
  }, [paginationEl]);

  return (
    <div>
      <Swiper
        slidesPerView="auto"
        className={containerClassName}
        spaceBetween={12}
        pagination={{
          el: paginationEl,
        }}
        autoHeight
        modules={[Pagination]}
        wrapperClass="swiper-wrapper px-4"
      >
        {React.Children.map(children, (child, index) => (
          <SwiperSlide
            className="max-w-min"
            key={index}
          >
            {child}
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        ref={paginationRef}
        className="flex justify-center gap-2 pt-4"
      />
    </div>
  );
};

export default CustomSwiper;
