"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { httpLink } from "@trpc/react-query";

import React, { useState } from "react";

import { trpc } from "./client";

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
      () =>
          new QueryClient({
            defaultOptions: {
              queries: {
                retry: 3, // Retry failed queries 2 times
                retryDelay: (attemptIndex) =>
                    Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
                cacheTime: 60 * 1000, // Cache data for 5 minutes
                staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
                refetchOnWindowFocus: false, // Disable refetch on window focus
              },
            },
          })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: `/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider
      client={trpcClient}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
