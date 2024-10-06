"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/app/_trpc/client";

type ConfigContextType = {
  config: { [key: string]: string | null };
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<{ [key: string]: string | null }>({});

  const { data, error } = trpc.config.getConfig.useQuery();

  useEffect(() => {
    if (data) {
      setConfig(data.config);

    }
  }, [data]);

  if (error) {
    console.error("Failed to fetch config:", error);
  }

  return (
    <ConfigContext.Provider value={{ config }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
