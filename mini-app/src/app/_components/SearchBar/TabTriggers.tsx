import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {Separator} from "@/components/ui/separator";

interface TabItem {
  value: string;
  label: string;
  borderClass?: string;
}

interface TabTriggersProps {
  tabs: TabItem[];
  tabValue: string;
  setTabValue: (value: string) => void;
}

const TabTriggers: React.FC<TabTriggersProps> = ({
  tabs,
  setTabValue,
  tabValue = "All",
}) => {
  return (
    <Tabs
      defaultValue={tabValue}
      className="bg-transparent px-0 py-0"
      onValueChange={(value) => setTabValue(value)}
    >
      <Separator className="my-0 bg-gray-700" />
      <TabsList className="bg-transparent px-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`px-3 py-0 text-gray-500 text-[14px] data-[state=active]:text-gray-100 data-[state=active]:font-bold rounded-none ${tab.borderClass || ""}`}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabTriggers;
