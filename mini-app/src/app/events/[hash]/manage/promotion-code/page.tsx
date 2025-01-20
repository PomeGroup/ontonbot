"use client";

import React from "react";
import { Page, Block } from "konsta/react";
import PromotionCode from "@/app/_components/Event/PromotionCode/PromotionCode";

export default function PromotionCodePage() {

  return (
    <Page>
      <Block className="px-4 pt-4">
        <h1 className="text-lg font-bold">Promotion Codes</h1>
      </Block>

      <PromotionCode  />
    </Page>
  );
}
