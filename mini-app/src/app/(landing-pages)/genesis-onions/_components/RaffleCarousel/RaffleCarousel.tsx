import { useState, useRef, useMemo } from "react";
import LoadableImage from "@/components/LoadableImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";

import Typography from "@/components/Typography";
import { CountdownTimer } from "../CountdownTimer";
import { generateWeightedArray } from "./RaffleCarousel.utils";
import { RaffleCarouselItem } from "./RaffleCarousel.types";
import { Button } from "@/components/ui/button";

export const RaffleCarousel = () => {
    const swiperRef = useRef<SwiperType>();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<RaffleCarouselItem | null>(null);
    const slides = useMemo(() => generateWeightedArray(), []);
    const [activeIndex, setActiveIndex] = useState(0);

    const waitForTransition = () => {
        return new Promise<void>((resolve, reject) => {
            const swiper = swiperRef.current;
            if (!swiper) {
                reject("Swiper instance not available");
                return;
            }

            // Add timeout as fallback
            const timeout = setTimeout(() => {
                swiper.off("transitionEnd", onTransitionEnd);
                resolve();
            }, 1000); // 1 second timeout

            const onTransitionEnd = () => {
                clearTimeout(timeout);
                swiper.off("transitionEnd", onTransitionEnd);
                resolve();
            };

            swiper.on("transitionEnd", onTransitionEnd);
        });
    };

    const spinRaffle = async () => {
        if (!swiperRef.current || isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        const targetIndex = Math.floor(Math.random() * slides.length);
        const targetValue = slides[targetIndex];

        try {
            // Fast spinning phase
            const fastSpinDuration = 200;
            swiperRef.current.params.speed = fastSpinDuration;

            for (let i = 0; i < Math.floor(slides.length * 0.7); i++) {
                swiperRef.current.slideTo(i % slides.length);
                await waitForTransition();
            }

            // Slowing down phase
            const slowDownDuration = 300;
            for (let i = 0; i < 5; i++) {
                swiperRef.current.params.speed = slowDownDuration * (i + 1);
                swiperRef.current.slideTo((targetIndex - 4 + i) % slides.length);
                await waitForTransition();
            }

            // Final slide
            swiperRef.current.params.speed = 500;
            swiperRef.current.slideTo(targetIndex);
            await waitForTransition();

            setResult(targetValue);
            console.log(slides, targetIndex, targetValue, swiperRef.current);
        } catch (error) {
            console.error("Error during spin:", error);
            // Fallback to setting result if transition fails
            setResult(targetValue);
        } finally {
            setIsSpinning(false);
        }
    };

    const remainingSpins = 0;

    return (
        <div className="flex flex-col gap-4 relative z-10 w-full max-w-full overflow-hidden">
            <div className="raffle-container max-w-full">
                <Swiper
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    slidesPerView={2.6}
                    centeredSlides={true}
                    spaceBetween={12}
                    speed={200}
                    initialSlide={2}
                >
                    {slides.map((item, index) => (
                        <SwiperSlide
                            key={item.id}
                            data-id={item.id}
                        >
                            <div
                                className={`
                flex flex-col items-center justify-center gap-3 transform transition-all duration-300
                ${activeIndex === index ? "scale-100" : "scale-75"}
              `}
                            >
                                <LoadableImage
                                    width={240}
                                    height={240}
                                    src={item.image}
                                    alt={item.label}
                                    className="w-full h-full object-cover object-center rounded-2lg"
                                />
                                <Typography
                                    variant="footnote"
                                    weight="normal"
                                >
                                    {item.label}
                                </Typography>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="px-4 flex flex-col gap-4">
                <Typography
                    variant="caption1"
                    weight="normal"
                    className="px-15 text-center"
                >
                    Spin the wheel, unwrap Onion Genesis NFTs, and collect your $ONION airdrop.
                </Typography>

                <CountdownTimer targetDate="2025-04-05T12:00:00" />

                <div className="flex flex-col gap-3">
                    <Typography
                        variant="subheadline1"
                        className="flex gap-1 justify-center items-end font-semibold"
                    >
                        You have <Typography variant="headline" className="text-gold-light">{remainingSpins}</Typography> spin{remainingSpins > 1 && "s"} left
                    </Typography>

                    <Button
                        onClick={spinRaffle}
                        type="button"
                        size="lg"
                        className="h-13 rounded-2lg flex items-center justify-center bg-orange hover:bg-orange group relative overflow-hidden"
                    >
                        <div className="absolute border-t-2 border-b-2 inset-0 transition-all bg-gradient-to-r from-orange/0 via-white/85 to-orange/0 group-hover:opacity-20 mix-blend-soft-light" />
                        <Typography
                            variant="headline"
                            weight="semibold"
                        >
                            {remainingSpins === 0 ? "Get More Spins" : "Spin"}
                        </Typography>
                    </Button>
                </div>
            </div>
        </div>
    );
};
