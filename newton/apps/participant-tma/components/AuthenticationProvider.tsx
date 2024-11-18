"use client";

import { PropsWithChildren } from "react";
import QueryState from "@ui/components/blocks/QueryState";

import useAuthenticate from "~/hooks/useAuthenticate";

const AuthenticationProvider = ({ children }: PropsWithChildren) => {
  const { isLoading, isError, error, data } = useAuthenticate();
  console.log({
    isLoading,
    isError,
    error,
    data
  });


  if (isLoading) {
    return <QueryState text="Authenticating" />;
  }

  if (isError) {
    console.error("Auth Error in provider.");
    console.error(error);

    return <QueryState
      isError
      text="Authentication Error"
      description={`${error.name}: ${error.message}`}
    />;
  }

  return <>{children}</>;
};

export default AuthenticationProvider;
