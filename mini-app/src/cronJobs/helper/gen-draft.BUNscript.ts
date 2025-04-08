/**
 * @file gen-draft.BUNscript.ts
 * @description 🔴 This script is designed to generate a draft event object using the `buildEventDraft` helper function.
 * It is intended to be executed exclusively using the Bun runtime. 🔴
 *
 * @note 🔴 Ensure that Bun is installed and properly configured before running this script. 🔴
 */

import { buildEventDraft } from "./buildEventDraft";

// @ts-expect-error
const draft = await buildEventDraft({
  event_uuid: "e9577d1e-6436-4072-ad2a-4cd71e43f23b",
  event_id: 2312,
  title: "CRYPTO & FOREX TRADE IDEA | MONEY MANAGEMENT; LONDON SESSION. EP: 9",
  subtitle: "RISK AND MONEY MANAGEMENT",
  description:
    "We focus on analyzing and executing trades during the London trading session, while also providing education on effective risk and money management strategies..",
  location: "https://x.com/i/spaces/1OdJrDmRPmVKX%5C",
  countryId: null,
  society_hub_id: "33",
  society_hub: "Onton",
  start_date: 1744012800,
  end_date: 1744016400,
  tsRewardImage: "https://storage.onton.live/onton/sbt_images/1743587604499-collection_1743587604477.jpg",
  tsRewardVideo: "https://storage.onton.live/ontonvideo/sbt_videos/1743587622076-collection_1743587621965.mp4",
  participationType: "online",
  activity_id: null,
  capacity: null,
  cityId: null,
});
console.log("draft", JSON.stringify(draft));
