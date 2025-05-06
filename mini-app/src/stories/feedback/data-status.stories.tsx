import DataStatus, { ANIMATION_SIZES, DATA_STATUS_ANIMATIONS } from "@/app/_components/molecules/alerts/DataStatus";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof DataStatus> = {
  component: DataStatus,
};

export default meta;
type Story = StoryObj<typeof DataStatus>;

export const Primary: Story = {
  args: {
    title: "Lorem ipsum dolor sit amet",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    status: "not_found",
    size: "lg",
  },
  argTypes: {
    status: {
      options: Object.keys(DATA_STATUS_ANIMATIONS),
      type: "string",
      control: {
        type: "select",
      },
    },
    size: {
      options: Object.keys(ANIMATION_SIZES),
      type: "string",
      control: {
        type: "select",
      },
    },
  },
};
