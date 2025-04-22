import { toNano } from "@ton/core";
import { Blockchain } from "@ton/sandbox";
import "@ton/test-utils";
import { NftMergeOnionContract } from "./output/nftMergeOnion_NftMergeOnionContract";

describe("nftMergeOnion contract", () => {
    it("should deploy and handle merges", async () => {
        // Create a Sandbox
        const system = await Blockchain.create();
        const owner = await system.treasury("owner");
        const notOwner = await system.treasury("notOwner");

        // Deploy
        const contract = system.openContract(await NftMergeOnionContract.fromInit(owner.address, false, false, false));
        const deployResult = await contract.send(owner.getSender(), { value: toNano("1") }, null);
        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: contract.address,
            deploy: true,
            success: true,
        });

        // By default, hasGold/Silver/Bronze = false
        expect(await contract.getHasGold()).toEqual(false);
        expect(await contract.getHasSilver()).toEqual(false);
        expect(await contract.getHasBronze()).toEqual(false);

        // Let's emulate "SendNFT(color='Gold')"
        // Tact auto-generated method might be something like "SendNFT"
        // We pass an object with $$type = "SendNFT" and color = "Gold"
        const sendGold = await contract.send(
            owner.getSender(),
            { value: toNano("0.05") },
            {
                $$type: "SendNFT",
                color: "Gold",
            }
        );
        expect(sendGold.transactions).toHaveTransaction({ success: true });
        expect(await contract.getHasGold()).toEqual(true);

        // Non-owner tries sending "Silver"
        const nonOwnerSilver = await contract.send(
            notOwner.getSender(),
            { value: toNano("0.05") },
            {
                $$type: "SendNFT",
                color: "Silver",
            }
        );
        // Suppose we have an exit code for "only owner" error
        // We check if transaction fails
        const accessDeniedExitCode = 132;
        expect(nonOwnerSilver.transactions).toHaveTransaction({
            from: notOwner.address,
            to: contract.address,
            success: false,
            exitCode: accessDeniedExitCode,
        });

        // Owner sends "Silver"
        await contract.send(
            owner.getSender(),
            { value: toNano("0.05") },
            {
                $$type: "SendNFT",
                color: "Silver",
            }
        );
        expect(await contract.getHasSilver()).toEqual(true);

        // Owner sends "Bronze"
        await contract.send(
            owner.getSender(),
            { value: toNano("0.05") },
            {
                $$type: "SendNFT",
                color: "Bronze",
            }
        );
        expect(await contract.getHasBronze()).toEqual(true);

        // Now we do "Merge()"
        const mergeResult = await contract.send(
            owner.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Merge",
            }
        );
        expect(mergeResult.transactions).toHaveTransaction({
            success: true,
        });

        // After Merge, we reset G/S/B
        expect(await contract.getHasGold()).toEqual(false);
        expect(await contract.getHasSilver()).toEqual(false);
        expect(await contract.getHasBronze()).toEqual(false);
    });
});
