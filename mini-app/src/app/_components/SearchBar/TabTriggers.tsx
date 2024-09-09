import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface TabItem {
  value: string;
  label: string;
  borderClass?: string;
}

interface TabTriggersProps {
  tabs: TabItem[];
  tabValue: string;
  setTabValue: (value: string) => void;
  swiperRef: React.MutableRefObject<any>;
}

const TabTriggers: React.FC<TabTriggersProps> = ({
  tabs,
  setTabValue,
  tabValue = "All",
  swiperRef,
}) => {
  const handleTabClick = (value: string, index: number) => {
    setTabValue(value);
    swiperRef.current?.slideTo(index); // Change the slide to match the clicked tab
  };
  return (
    <Tabs
      value={tabValue}
      className="bg-transparent px-0 py-0"
      onValueChange={(value) => setTabValue(value)}
    >
      <Separator className="my-0 bg-gray-700" />
      <TabsList className="bg-transparent px-0">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            onClick={() => handleTabClick(tab.value, index)}
            className={`px-1.5 py-0   text-gray-500 text-[13.5px] data-[state=active]:text-gray-100 data-[state=active]:font-bold rounded-none ${tab.borderClass || ""}`}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabTriggers;
