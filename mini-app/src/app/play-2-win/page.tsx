"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { Page } from "konsta/react";
import React from "react";

const PlayToWin: React.FC = () => {
  return (
    <Page>
      <h1>Play to Win</h1>
      <p>Welcome to the Play to Win page!</p>
      <BottomNavigation active="Play2Win" />
    </Page>
  );
};

export default PlayToWin;
