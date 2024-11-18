"use client";

import withPlatform from "@tma/hoc/withPlatform";

import SeparatorAndroid from "./Separator.android";
import SeparatorIos from "./Separator.ios";

const SeparatorTma = withPlatform(SeparatorIos, SeparatorAndroid);

export default SeparatorTma;
