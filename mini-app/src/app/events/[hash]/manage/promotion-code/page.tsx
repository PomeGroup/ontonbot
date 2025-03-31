"use client";

import PromotionCode from "@/app/_components/Event/PromotionCode/PromotionCode";
import Typography from "@/components/Typography";
import { Page } from "konsta/react";

export default function PromotionCodePage() {
  return (
    <Page className="p-4 space-y-3">
      <Typography variant="title2">Promotion Codes</Typography>

      <PromotionCode />
    </Page>
  );
}
