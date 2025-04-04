import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import "swiper/css";
import Typography from "@/components/Typography";
import { CountdownTimer } from "../CountdownTimer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/utils";
import { useSpin } from "../../hooks/useSpin";
import { TokenCampaignNftCollections } from "@/db/schema";
import { useUserCampaign } from "../../hooks/useUserCampaign";

interface Props {
    onEligibilityCheckFailed: () => void;
    onInsufficientBalance: () => void;
    onSpinStart: () => void;
    onSpinEnd: (result: TokenCampaignNftCollections) => void;
}

export const RaffleCarousel = ({ onEligibilityCheckFailed, onInsufficientBalance, onSpinStart, onSpinEnd }: Props) => {
    const swiperRef = useRef<SwiperType>();
    const [isSpinning, setIsSpinning] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const { slides, isLoadingCollections, isErrorCollections, spin } = useSpin();
    const { userSpinStats,
        isLoadingUserSpinStats,
        isErrorUserSpinStats,
        refetchUserSpinStats,
        isEligible,
        isLoadingEligibility,
        isErrorEligibility,
        refetchEligibility
    } = useUserCampaign();

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
        if (!swiperRef.current || isSpinning || !slides?.length) return;

        onSpinStart();
        setIsSpinning(true);

        const selectedIndex = await spin();

        if (typeof selectedIndex === "undefined") throw new Error("No proper result received!");

        const selectedSlide = slides[selectedIndex];

        try {
            // Fast spinning phase
            const fastSpinDuration = 50;
            swiperRef.current.params.speed = fastSpinDuration;

            for (let i = 0; i < Math.floor(slides.length * 0.7); i++) {
                swiperRef.current.slideTo(i % slides.length);
                await waitForTransition();
            }

            // Slowing down phase
            const slowDownDuration = 300;
            for (let i = 0; i < 5; i++) {
                swiperRef.current.params.speed = slowDownDuration * (i + 1);
                swiperRef.current.slideTo((selectedIndex - 4 + i) % slides.length);
                await waitForTransition();
            }

            // Final slide
            swiperRef.current.params.speed = 500;
            swiperRef.current.slideTo(selectedIndex);
            await waitForTransition();

            refetchUserSpinStats();
            console.log("selectedSlide", selectedSlide);
            if (selectedSlide) onSpinEnd(selectedSlide);
        } catch (error) {
            console.error("Error during spin:", error);
            // Fallback to setting result if transition fails
        } finally {
            setIsSpinning(false);
        }
    };

    const remainingSpins = userSpinStats?.remaining ?? 0;

    const handleButtonClick = async () => {
        if (isErrorEligibility) {
            refetchEligibility();
            throw new Error("Error checking eligibility. Trying to refetch...");
        }

        if (isEligible === false) {
            onEligibilityCheckFailed();
            return;
        }
        if (remainingSpins > 0) {
            spinRaffle();
        } else {
            onInsufficientBalance();
        }
    };

    if (isLoadingCollections) return null;
    if (isErrorCollections) return <div>Error loading slides! Please try again.</div>;

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
                    initialSlide={1}
                    draggable={false}
                    allowTouchMove={false}
                >
                    {slides?.map((item, index) => (
                        <SwiperSlide
                            key={index}
                            data-id={item.id}
                        >
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 transform transition-all duration-300",
                                    activeIndex === index ? "scale-100" : "scale-75"
                                )}
                            >
                                {item.image && (
                                    <Image
                                        width={240}
                                        height={240}
                                        src={item.image}
                                        alt={item.name ?? ""}
                                        className="w-full h-full object-cover object-center rounded-2lg"
                                    />
                                )}
                                <Typography
                                    variant="footnote"
                                    weight="normal"
                                >
                                    {item.name}
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
                        You have{" "}
                        <Typography
                            variant="headline"
                            className="text-gold-light"
                        >
                            {remainingSpins}
                        </Typography>{" "}
                        spins left
                    </Typography>

                    <Button
                        onClick={handleButtonClick}
                        type="button"
                        size="lg"
                        disabled={isSpinning || isLoadingUserSpinStats || isErrorUserSpinStats || isLoadingEligibility || isErrorEligibility}
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
