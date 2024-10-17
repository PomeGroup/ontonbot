"use client";

import withPlatform from "../tma/hoc/withPlatform";
import PageIos from "./Page.ios";

const PageTma = withPlatform(PageIos, PageIos);

export default PageTma;
