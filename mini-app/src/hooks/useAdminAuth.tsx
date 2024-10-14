import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import useWebApp from "./useWebApp";
import { UserType } from "@/types/user.types";

interface UseAdminAuthOptions {
  useLocalStorage?: boolean;
}

const useAdminAuth = ({ useLocalStorage = true }: UseAdminAuthOptions = {}) => {
  const [authorized, setAuthorized] = useState<boolean | null>(() => {
    if (useLocalStorage) {
      const storedAuth = localStorage.getItem("authorized");
      return storedAuth ? JSON.parse(storedAuth) : null;
    }
    return null;
  });

  const [role, setRole] = useState < UserType['userRole'] | undefined>(() => {
    if (useLocalStorage) {
      return localStorage.getItem("userRole") || undefined;
    }
    return undefined;
  });

  const [user, setUser] = useState<any>(() => {
    if (useLocalStorage) {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : undefined;
    }
    return undefined;
  });

  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";

  const validateUserInitDataQuery = trpc.users.haveAccessToEventAdministration.useQuery(
    { init_data: initData },
    {
      enabled: !!initData, // Only run the query if initData is available
    }
  );

  useEffect(() => {
    if (validateUserInitDataQuery.data) {
      const isValid = !!validateUserInitDataQuery.data?.valid;

      if (isValid) {
        setAuthorized(true);
        setRole(validateUserInitDataQuery.data.role);
        setUser(validateUserInitDataQuery.data.user);

        if (useLocalStorage) {
          // Save to localStorage if flag is enabled
          localStorage.setItem("authorized", "true");
          localStorage.setItem("userRole", validateUserInitDataQuery.data.role);
          localStorage.setItem("user", JSON.stringify(validateUserInitDataQuery.data.user));
        }
      } else {
        // If invalid, clear authorization and localStorage
        setAuthorized(false);
        setRole(undefined);
        setUser(undefined);

        if (useLocalStorage) {
          localStorage.removeItem("authorized");
          localStorage.removeItem("userRole");
          localStorage.removeItem("user");
        }
      }
    }

    if (validateUserInitDataQuery.isError) {
      // On error, clear localStorage if enabled
      if (useLocalStorage) {
        localStorage.removeItem("authorized");
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
      }
    }
  }, [validateUserInitDataQuery.data, validateUserInitDataQuery.isError, useLocalStorage]);

  return {
    authorized,
    isLoading: validateUserInitDataQuery.isLoading,
    role,
    user,
    error: validateUserInitDataQuery.isError ? validateUserInitDataQuery.error : null,
  };
};

export default useAdminAuth;
