import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import useWebApp from "./useWebApp";

const useAuth = () => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";

  const validateUserInitDataQuery =
    trpc.users.haveAccessToEventAdministration.useQuery(initData, {
      queryKey: ["users.haveAccessToEventAdministration", initData],
    });

  useEffect(() => {
    if (!initData) {
      setIsLoading(false);
      return;
    }

    if (
      validateUserInitDataQuery.isLoading ||
      validateUserInitDataQuery.isError
    ) {
      setIsLoading(true);
      return;
    }

    setAuthorized(!!validateUserInitDataQuery.data?.valid);
    setIsLoading(false);
  }, [
    initData,
    validateUserInitDataQuery.data,
    validateUserInitDataQuery.isLoading,
    validateUserInitDataQuery.isError,
  ]);

  return {
    authorized,
    isLoading,
    role: validateUserInitDataQuery.data?.valid
      ? validateUserInitDataQuery.data?.role
      : undefined,
    user: validateUserInitDataQuery.data?.valid
      ? validateUserInitDataQuery.data?.user
      : undefined,
  };
};

export default useAuth;
