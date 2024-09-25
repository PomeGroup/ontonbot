"use client";

import Link from "next/link";
import { useUtils } from "@telegram-apps/sdk-react";

type Props = {
  label: string;
  link: string;
};
const WebsiteLink = (props: Props) => {
  const tmaUtils = useUtils();

  return (
    <Link
      href={"#"}
      onClick={() => tmaUtils?.openLink(props.link)}
      className={"text-telegram-link-color"}
    >
      {props.label}
    </Link>
  );
};
export default WebsiteLink;
