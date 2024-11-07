"use client";

import React from "react";
import { retrieveLaunchParams } from "@tma.js/sdk-react";
import { platformSwitch } from "@tma/utils/platformSwitch";

const withPlatform = <P extends object>(
  ComponentIOS: React.ComponentType<P>,
  ComponentAndroid: React.ComponentType<P>,
) => {
  return (props: P) => {
    let platform;
    try {
      const params = retrieveLaunchParams();
      platform = params.platform;
    } catch (error) {
      console.error(error);
    }
    const Component = platformSwitch(platform, {
      ios: () => ComponentIOS,
      android: () => ComponentAndroid,
      default: () => ComponentIOS,
    });

    return <Component {...props} />;
  };
};

export default withPlatform;
