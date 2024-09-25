import React from "react";
import { Page } from "@ui/base/page";
import { twMerge } from "tailwind-merge";

type Props = React.ComponentProps<typeof Page>;
const PageIos = (props: Props) => {
  return (
    <Page className={twMerge("gap-[6px]", props.className)} {...props}>
      {props.children}
    </Page>
  );
};
export default PageIos;
