"use client";

import { ReactNode } from "react";
import { TonProvider } from "~/components/TonProvider";
import { useProofAuth } from "~/hooks/useProofAuth";

const EventLayout = (props: {
  children: React.ReactNode;
  params: { id: string };
}) => {
  return (
    <TonProvider startAppParam={props.params.id}><TonAuth>
      {props.children}
    </TonAuth>
    </TonProvider>
  );
};

const TonAuth = ({ children
}: { children: ReactNode }) => {
  useProofAuth()
  return children
}

export default EventLayout;
