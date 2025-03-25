import CustomSwiper from "@/app/_components/CustomSwiper";
import type { Meta, StoryObj } from "@storybook/react";

type SlidersProps = {};

const Sliders = ({}: SlidersProps) => {
  return (
    <div className="max-w-64 overflow-hidden">
      <CustomSwiper>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              height: 100,
              width: 100,
              backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            }}
            className="flex items-center justify-center font-bold text-2xl"
          >
            {idx}
          </div>
        ))}
      </CustomSwiper>
    </div>
  );
};

const meta: Meta<typeof Sliders> = {
  component: Sliders,
};

export default meta;
type Story = StoryObj<typeof Sliders>;

export const Primary: Story = {
  args: {},
};
