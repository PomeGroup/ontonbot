import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

type VideoProps = {};

const VideoInput = ({}: VideoProps) => {
  const [result, setResult] = useState<string>("");

  return (
    <div className="bg-gray-500 p-4">
      <input
        type="file"
        name="video"
        accept="video/*"
        id="event_video_input"
      />
      {result && <p className="mt-2 text-white">{result}</p>}
    </div>
  );
};

const meta: Meta<typeof VideoInput> = {
  component: VideoInput,
};

export default meta;
type Story = StoryObj<typeof VideoInput>;

export const Primary: Story = {
  args: {},
};
