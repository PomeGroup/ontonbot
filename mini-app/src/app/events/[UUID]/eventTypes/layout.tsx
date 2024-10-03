"use client";

import { ReactNode } from "react";

type EventTypesLayoutProps = {
  children: ReactNode; // This will be the specific content for each event type
};

const EventTypesLayout = ({ children }: EventTypesLayoutProps) => {
  return (
    <div>
      layout chield
      {children}

    </div>
  );
};

export default EventTypesLayout;
