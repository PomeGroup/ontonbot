import React from "react";
import { Button } from "../base/button";

type Props = React.ComponentProps<typeof Button>;

const ButtonAndroid = (props: Props) => {
  return <Button {...props}>{props.children}</Button>;
};
export default ButtonAndroid;
