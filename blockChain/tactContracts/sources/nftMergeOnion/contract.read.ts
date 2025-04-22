import { Address, contractAddress } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { NftMergeOnionContract } from "./output/nftMergeOnion_NftMergeOnionContract";

(async () => {
    const client = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com", // Testnet endpoint
    });

    // Suppose we have the same constructor arguments as deploy
    let owner = Address.parse("kQBM7QssP28PhrctDOyd47_zpFfDiQvv5V9iXizNopb1d2LB");
    let init = await NftMergeOnionContract.init(owner, false, false, false);
    let contractAddress = contractAddress(0, init);

    console.log("Reading NftMergeOnion Contract Info...");
    console.log(contractAddress);

    // open contract
    let contract = await NftMergeOnionContract.fromAddress(contractAddress);
    let contractOpen = client.open(contract);

    // read "has_gold"
    let hasGold = await contractOpen.getHasGold(); // Tact auto-generated method
    let hasSilver = await contractOpen.getHasSilver();
    let hasBronze = await contractOpen.getHasBronze();

    console.log(`hasGold: ${hasGold}`);
    console.log(`hasSilver: ${hasSilver}`);
    console.log(`hasBronze: ${hasBronze}`);
})();
