import { findActivity } from "./lib/ton-society-api";

async function main() {
  const result = await findActivity(2204);
  console.log(result.data.rewards.collection_address);
}

main().then(() => console.log("done"));
