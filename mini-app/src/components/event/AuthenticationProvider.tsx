"use client";

import useAuthenticate from "@/hooks/useAuthenticate";
import { PropsWithChildren } from "react";
import QueryState from "../blocks/QueryState";

const AuthenticationProvider = ({ children }: PropsWithChildren) => {
  const { isLoading, isError, error } = useAuthenticate();

  if (isLoading) {
    return <QueryState text="Authenticating" />;
  }

  if (isError) {
    console.error("Auth Error in provider.");
    console.error(error);

    return (
      <QueryState
        isError
        text="Authentication Error"
        description={`${(error as Error).name}: ${(error as Error).message}`}
      />
    );
  }

  return <>{children}</>;
};

export default AuthenticationProvider;
