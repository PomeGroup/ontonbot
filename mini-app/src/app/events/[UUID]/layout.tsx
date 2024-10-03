"use client";

import { ReactNode } from "react";

type EventLayoutProps = {
  children: ReactNode; // This will be the specific content for each event type
};

const EventLayout = ({ children }: EventLayoutProps) => {
  return (
    <div>
      layout main
      {children}

    </div>
  );
};

export default EventLayout;
