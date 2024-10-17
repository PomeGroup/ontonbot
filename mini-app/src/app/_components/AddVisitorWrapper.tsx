
import useWebApp from "@/hooks/useWebApp";
import React, { FC, useLayoutEffect } from "react";
import { trpc } from "../_trpc/client";

const AddVisitorWrapper: FC<{ children: React.ReactNode; UUID: string }> = ({
  children,
  UUID,
}) => {
  const addVisitorMutation = trpc.visitors.add.useMutation();
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";

  useLayoutEffect(() => {
    if (!UUID) {
      return;
    }

    async function addVisitor() {
      await addVisitorMutation.mutateAsync({
        initData,
        event_uuid: UUID,
      });
    }

    addVisitor();
  }, [UUID, initData]);

  return <>{children}</>;
};

export default AddVisitorWrapper;
