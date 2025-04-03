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

    // Ensure first three items are in the required order
    const firstThreeItems: RaffleCarouselItem[] = [
        { id: id++, image: ImageBronze.src, label: "Bronze @NION" },
        { id: id++, image: ImageGolden.src, label: "Gold @NION" },
        { id: id++, image: ImageSilver.src, label: "Silver @NION" }
    ];

    // Generate remaining items
    const remainingBronze = createItems(bronzeCount - 1, ImageBronze.src, "Bronze @NION");
    const remainingGold = createItems(goldenCount - 1, ImageGolden.src, "Gold @NION");
    const remainingSilver = createItems(silverCount - 1, ImageSilver.src, "Silver @NION");

    const remainingItems = [...remainingBronze, ...remainingGold, ...remainingSilver];

    // Shuffle remaining items
    for (let i = remainingItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
    }

    return [...firstThreeItems, ...remainingItems];
};
