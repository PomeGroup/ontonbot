import { TournamentTimeRemaining } from "@/app/_components/Tournament/TournamentRemainingTime";
import LoadableImage from "@/components/LoadableImage";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof TournamentTimeRemaining> = {
  component: TournamentTimeRemaining,
  render: (args) => {
    return (
      <div className="relative">
        <LoadableImage
          width={300}
          height={300}
          src="invliad" // uses a placeholder
        />
        <TournamentTimeRemaining {...args} />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof TournamentTimeRemaining>;

enum SpaceEnum {
  sm = "sm",
  md = "md",
}

export const Primary: Story = {
  args: {
    closeOnly: true,
    endDate: new Date(Date.now() + 10000000).toString(),
    space: "sm",
  },
  argTypes: {
    space: {
      options: Object.values(SpaceEnum).filter((x) => typeof x === "string"),
      mapping: SpaceEnum,
      control: {
        type: "select",
      },
    },
  },
};
