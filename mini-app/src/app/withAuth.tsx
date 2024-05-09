'use client'

import React, { ComponentType, useEffect, useState } from 'react';
import { trpc } from './_trpc/client';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WebApp = window.Telegram.WebApp;

  const WithAuthComponent: React.FC<P> = (props) => {
    const [authorized, setAuthorized] = useState(false);
    const validateUserInitDataQuery = trpc.users.haveAccessToEventAdministration.useQuery(WebApp.initData, {
      enabled: !!WebApp.initData
    })

    useEffect(() => {
      async function validateUserInitData() {
        if (!WebApp.initData) {
          return;
        }

        if (validateUserInitDataQuery.isLoading || validateUserInitDataQuery.isError || !validateUserInitDataQuery.data) {
          return;
        }

        setAuthorized(true);
      }

      validateUserInitData();
    }, [WebApp.initData, validateUserInitDataQuery.data]);


    if (validateUserInitDataQuery.isLoading || validateUserInitDataQuery.data === undefined) {
      return;
    }

    if (authorized === false && validateUserInitDataQuery.data === false) {
      return <div className='text-center text-2xl mt-20'>😈 Not Authorized <br /> <span className='text-sm'>Please request organizer rights</span> </div>
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${getDisplayName(WrappedComponent)})`;

  return WithAuthComponent;
};

// Helper function to get a component's display name
function getDisplayName(WrappedComponent: ComponentType<any>): string {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default withAuth;
