import { ImageBronze, ImageGolden, ImageSilver } from "../../GenesisOnions.constants";
import { RaffleCarouselItem } from "./RaffleCarousel.types";


export const generateWeightedArray = (): RaffleCarouselItem[] => {
    const items: RaffleCarouselItem[] = [];
    const totalItems = 30; // Total number of items

    // Calculate counts based on probabilities
    const goldenCount = Math.floor(totalItems * 0.1); // 10%
    const silverCount = Math.floor(totalItems * 0.3); // 30%
    const bronzeCount = Math.floor(totalItems * 0.7); // 70%

    let id = 1; // Unique ID counter

    const createItems = (count: number, image: string, label: string) => {
        return Array.from({ length: count }, () => ({
            id: id++, // Assign unique ID
            image,
            label,
        }));
    };

    items.push(...createItems(goldenCount, ImageGolden.src, "Gold @NION"));
    items.push(...createItems(silverCount, ImageSilver.src, "Silver @NION"));
    items.push(...createItems(bronzeCount, ImageBronze.src, "Bronze @NION"));

    // Shuffle array
    return items.sort(() => Math.random() - 0.5);
};