import PromotionCodeIcon from "@/app/_components/icons/promotion-code-icon";
import type { Meta, StoryObj } from "@storybook/react";

type IconsProps = {};

const IconsTesting = ({}: IconsProps) => {
  return (
    <div className="max-w-64 overflow-hidden">
      <PromotionCodeIcon className="text-primary" />
    </div>
  );
};

const meta: Meta<typeof IconsTesting> = {
  component: IconsTesting,
};

export default meta;
type Story = StoryObj<typeof IconsTesting>;

export const Primary: Story = {
  args: {},
};
