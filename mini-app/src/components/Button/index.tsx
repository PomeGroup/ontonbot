"use client";

import withPlatform from "../tma/hoc/withPlatform";
import ButtonAndroid from "./Button.android";
import ButtonIOS from "./Button.ios";

const ButtonTma = withPlatform(ButtonIOS, ButtonAndroid);

export default ButtonTma;
