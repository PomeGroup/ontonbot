import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { SbtOptionContent } from "../../SbtOptionContent";
import ManageEventCard from "../ManageEventCard";

const ManageEventReward = () => {
  const { errors, clearImageErrors, clearVideoErrors } = useCreateEventStore((state) => ({
    clearImageErrors: state.clearImageErrors,
    clearVideoErrors: state.clearVideoErrors,
    errors: state.rewardStepErrors,
  }));
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
            errors={errors ?? {}}
            clearImageError={clearImageErrors}
            clearVideoError={clearVideoErrors}
          />
        </TabsContent>
        <TabsContent value="custom">
          <SbtOptionContent
            sbtOption={"custom"}
            errors={errors ?? {}}
            clearImageError={clearImageErrors}
            clearVideoError={clearVideoErrors}
          />
        </TabsContent>
      </Tabs>
    </ManageEventCard>
  );
};

export default ManageEventReward;
