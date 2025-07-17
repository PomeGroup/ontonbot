"use client";

import { ErrorState } from "@/app/_components/ErrorState";
import { useParams } from "next/navigation";
import { ReactNode } from "react";
import z from "zod";

export default (props: { children: ReactNode }) => {
  const params = useParams<{ hash: string }>();

  if (!z.string().uuid().safeParse(params.hash).success) {
    return <ErrorState errorCode="event_not_found" />;
  }

  return <>{props.children}</>;
};
