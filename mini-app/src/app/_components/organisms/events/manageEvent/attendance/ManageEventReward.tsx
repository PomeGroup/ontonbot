import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SbtOptionContent } from "../../SbtOptionContent";
import ManageEventCard from "../ManageEventCard";

const ManageEventReward = () => {
  return (
    <ManageEventCard title="Has Reward">
      <Tabs
        defaultValue="custom"
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        <TabsContent
          value="default"
          className="flex flex-col gap-4 font-normal"
        >
          <SbtOptionContent
            sbtOption={"default"}
            errors={{}}
            clearImageError={() => {}}
            clearVideoError={() => {}}
          />
        </TabsContent>
        <TabsContent value="custom">
          <SbtOptionContent
            sbtOption={"custom"}
            errors={{}}
            clearImageError={() => {}}
            clearVideoError={() => {}}
          />
        </TabsContent>
      </Tabs>
    </ManageEventCard>
  );
};

export default ManageEventReward;
