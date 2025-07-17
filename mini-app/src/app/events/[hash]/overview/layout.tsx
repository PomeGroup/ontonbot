import { ReactNode } from "react";
import { EventOverviewProvider } from "./overview.context";

export default (props: { children: ReactNode }) => {
  return <EventOverviewProvider>{props.children}</EventOverviewProvider>;
};
