"use client";

import Link from "next/link";
import Labels from "@/app/_components/atoms/labels/index";
import useWebApp from "@/hooks/useWebApp";

const normalizeURL2 = (url: string) => {
  // remove protocol from the url, remove www if any, keep the rest of it, but cut it after 30 characters
  return url
    .replace(/(^\w+:|^)\/\//, "")
    .replace(/www\./, "")
    .slice(0, 30);
};

type Props = {
  location: string;
};

const WebsiteLink = ({ location }: Props) => {
  const webApp = useWebApp();

  return (
    <Link
      href={"#"}
      onClick={() => webApp?.openLink(location)}
    >
      <Labels.Label>{normalizeURL2(location)}</Labels.Label>
    </Link>
  );
};
export default WebsiteLink;
