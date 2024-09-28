import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import useWebApp from "./useWebApp";

const useAdminAuth = () => {
  // FIXME change it to useIsAdmin
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";

  const validateUserInitDataQuery =
    trpc.users.haveAccessToEventAdministration.useQuery(
      { init_data: initData },
      {
        enabled: !!initData,
      }
    );

  useEffect(() => {
    if (validateUserInitDataQuery.data) {
      setAuthorized(!!validateUserInitDataQuery.data?.valid);
    }
  }, [validateUserInitDataQuery.data]);

  return {
    authorized,
    isLoading: validateUserInitDataQuery.isLoading,
    role: validateUserInitDataQuery.data?.valid
      ? validateUserInitDataQuery.data?.role
      : undefined,
    user: validateUserInitDataQuery.data?.valid
      ? validateUserInitDataQuery.data?.user
      : undefined,
    error: validateUserInitDataQuery.isError
      ? validateUserInitDataQuery.error
      : null,
  };
};

export default useAdminAuth;
