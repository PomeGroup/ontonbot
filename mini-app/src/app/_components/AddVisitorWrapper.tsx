"use client";

import useWebApp from "@/hooks/useWebApp";
import React, { FC, useLayoutEffect } from "react";
import { trpc } from "../_trpc/client";

const AddVisitorWrapper: FC<{ children: React.ReactNode; hash: string }> = ({
  children,
  hash,
}) => {
  const addVisitorMutation = trpc.visitors.add.useMutation();
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";

  useLayoutEffect(() => {
    if (!hash) {
      return;
    }

    async function addVisitor() {
      await addVisitorMutation.mutateAsync({
        initData,
        event_uuid: hash,
      });
    }

    addVisitor();
  }, [hash, initData]);

  return <>{children}</>;
};

export default AddVisitorWrapper;
