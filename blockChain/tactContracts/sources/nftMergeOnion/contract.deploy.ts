import * as fs from "fs";
import * as path from "path";
import { Address, contractAddress } from "@ton/core";
import { NftMergeOnionContract } from "./output/nftMergeOnion_NftMergeOnionContract";
import { prepareTactDeployment } from "@tact-lang/deployer";

(async () => {
    // Example parameters
    let testnet = true; // or false for mainnet
    let packageName = "nftMergeOnion_NftMergeOnionContract.pkg";

    // We'll pass in an owner address, plus initial states for hasGold, hasSilver, hasBronze
    // For demonstration, we set them false
    let owner = Address.parse("kQBM7QssP28PhrctDOyd47_zpFfDiQvv5V9iXizNopb1d2LB");
    let init = await NftMergeOnionContract.init(owner, false, false, false);

    // Derive contract address from code+data cells
    let address = contractAddress(0, init);

    // Prepare for upload
    let data = init.data.toBoc();
    let pkg = fs.readFileSync(path.resolve(__dirname, "output", packageName));

    console.log("Uploading package...");
    let prepare = await prepareTactDeployment({ pkg, data, testnet });

    console.log("============================================================================================");
    console.log("Contract Address:");
    console.log(address.toString({ testOnly: testnet }));
    console.log("============================================================================================");
    console.log("Follow deployment link below:");
    console.log(prepare);
    console.log("============================================================================================");
})();
