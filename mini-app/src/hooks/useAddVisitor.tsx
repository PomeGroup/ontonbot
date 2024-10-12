"use client";

import { useLayoutEffect } from "react";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";

const useAddVisitor = (hash: string) => {
  const addVisitorMutation = trpc.visitors.add.useMutation();
  const WebApp = useWebApp();

  useLayoutEffect(() => {
    const addVisitor = async () => {
      if (WebApp?.initData) {
        await addVisitorMutation.mutateAsync({
          init_data: WebApp.initData,
          event_uuid: hash,
        });
      }
    };

    addVisitor();
  }, [hash, WebApp?.initData]);
};

export default useAddVisitor;
