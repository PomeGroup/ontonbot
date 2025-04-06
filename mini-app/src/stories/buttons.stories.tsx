import CustomButton from "@/app/_components/Button/CustomButton";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof CustomButton> = {
  component: CustomButton,
};

export default meta;
type Story = StoryObj<typeof CustomButton>;

export const Primary: Story = {
  args: {
    children: "Button",
    variant: "primary",
  },
  argTypes: {
    variant: {
      options: [
        "primary",
        "ghost",
        "success",
        "outline",
        "destructive",
        "success-outline",
        "destructive-outline",
        "success-link",
        "destructive-link",
      ],

      control: { type: "select" },
    },
    size: {
      options: ["lg", "md"],
      control: { type: "select" },
    },
  },
};
