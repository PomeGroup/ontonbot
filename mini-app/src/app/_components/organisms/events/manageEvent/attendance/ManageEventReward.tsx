import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SBTRewardType, useCreateEventStore } from "@/zustand/createEventStore";
import { SbtOptionContent } from "../../SbtOptionContent";
import ManageEventCard from "../ManageEventCard";

const ManageEventReward = () => {
  const { rewardType, errors, clearImageErrors, clearVideoErrors, setRewardType } = useCreateEventStore((state) => ({
    clearImageErrors: state.clearImageErrors,
    clearVideoErrors: state.clearVideoErrors,
    errors: state.rewardStepErrors,
    rewardType: state.eventData.reward.type,
    setRewardType: state.setRewardType,
  }));

  return (
    <ManageEventCard title="Has Reward">
      <Tabs
        defaultValue={rewardType}
        className="w-full"
        onValueChange={(value) => {
          setRewardType(value as SBTRewardType);
        }}
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
          {/* <SbtOptionContent
            sbtOption={"custom"}
            errors={errors ?? {}}
            clearImageError={clearImageErrors}
            clearVideoError={clearVideoErrors}
          /> */}
        </TabsContent>
      </Tabs>
    </ManageEventCard>
  );
};

export default ManageEventReward;
