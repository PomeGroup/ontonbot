import React from "react";
import { Separator } from "../base/separator";

type SeparatorProps = React.ComponentProps<typeof Separator>;

const SeparatorAndroid: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  ...props
}) => {
  return (
    <Separator
      {...props}
      orientation={orientation}
      // className={clsx({
      //   "h-[0.33px] w-full": orientation === "horizontal",
      //   "h-full w-[0.33px]": orientation === "vertical",
      // })}
    />
  );
};

export default SeparatorAndroid;
