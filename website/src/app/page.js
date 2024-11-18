"use client";
import CTASection from "@/components/sections/CTASection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowWorksSection";
import LeaderboardSection from "@/components/sections/LeaderboardSection";
import ONIONSection from "@/components/sections/ONIONSection";
import StatisticsSection from "@/components/sections/StatisticSection";

export default function Home() {

  return (
    <>
      <CTASection />
      <StatisticsSection />
      <FeaturesSection />
      <LeaderboardSection />
      <HowItWorksSection />
      <ONIONSection />
    </>
  );
}
