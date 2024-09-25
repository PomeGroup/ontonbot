"use client";

import React from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { platformSwitch } from "../utils/platformSwitch";

const withPlatform = <P extends object>(
  ComponentIOS: React.ComponentType<P>,
  ComponentAndroid: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
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

  // Set a display name for the HOC
  WrappedComponent.displayName = `withPlatform(${ComponentIOS.displayName || "ComponentIOS"}, ${ComponentAndroid.displayName || "ComponentAndroid"})`;

  return WrappedComponent;
};

export default withPlatform;
