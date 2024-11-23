import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TabItem {
  value: string;
  label: string;
  borderClass?: string;
}

interface TabTriggersProps {
  tabs: TabItem[];
  tabValue: string;
  setTabValue: (_value: string) => void;
  swiperRef: React.MutableRefObject<any>;
}

const TabTriggers: React.FC<TabTriggersProps> = ({ tabs, setTabValue, tabValue = "All", swiperRef }) => {
  const handleTabClick = (value: string, index: number) => {
    setTabValue(value);

    swiperRef.current?.slideTo(index); // Change the slide to match the clicked tab
  };
  return (
    <Tabs
      value={tabValue}
      className="bg-transparent px-0 py-0 "
      onValueChange={(value) => setTabValue(value)}
    >
      <ScrollArea className="w-full whitespace-nowrap border-0 h-12">
        <TabsList className="bg-transparent px-0">
          {tabs.map((tab, index) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              onClick={() => handleTabClick(tab.value, index)}
              className={`px-3 py-2    text-gray-500 text-sm data-[state=active]:text-gray-100 data-[state=active]:font-bold data-[state=active]:border-b-indigo-50 data-[state=active]:border-b-2   rounded-none `}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
};

export default TabTriggers;
