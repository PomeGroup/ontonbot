"use client";

import useWebApp from "@/hooks/useWebApp";
import React, { ComponentType, useEffect, useState } from "react";
import { trpc } from "./_trpc/client";

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const [authorized, setAuthorized] = useState(false);
    const WebApp = useWebApp();
    const initData = WebApp?.initData || "";
    const validateUserInitDataQuery =
      trpc.users.haveAccessToEventAdministration.useQuery(
        { init_data: initData },
        {
          enabled: !!initData,
          queryKey: [
            "users.haveAccessToEventAdministration",
            {
              init_data: initData,
            },
          ],
        }
      );

    useEffect(() => {
      async function validateUserInitData() {
        if (!initData) {
          return;
        }

        if (
          validateUserInitDataQuery.isLoading ||
          validateUserInitDataQuery.isError ||
          !validateUserInitDataQuery.data
        ) {
          return;
        }

        setAuthorized(true);
      }

      validateUserInitData();
    }, [initData, validateUserInitDataQuery.data]);

    if (
      validateUserInitDataQuery.isLoading ||
      validateUserInitDataQuery.data === undefined
    ) {
      return;
    }

    if (
      authorized === false &&
      validateUserInitDataQuery.data.valid === false
    ) {
      return (
        <div className="text-center text-2xl mt-20">
          😈 Not Authorized <br />{" "}
          <span className="text-sm">Please request organizer rights</span>{" "}
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${getDisplayName(
    WrappedComponent
  )})`;

  return WithAuthComponent;
};

// Helper function to get a component's display name
function getDisplayName(WrappedComponent: ComponentType<any>): string {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export default withAuth;
