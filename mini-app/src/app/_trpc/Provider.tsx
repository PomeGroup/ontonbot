"use client";

import { httpLink } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from "react";
import { trpc } from "./client";
import { useUserStore } from "@/context/store/user.store";

export default function TRPCAPIProvider({ children }: { children: React.ReactNode }) {
  const { initData } = useUserStore()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false
      }
    }
  }));

  const [trpcClient] = useState(trpc.createClient({
    links: [
      // createCombinedLink(),
      httpLink({
        url: "/api/trpc",
        headers: () => {
          return {
            Authorization: initData!
          }
        }
      }),
    ],
  })
  )

  return (
    <trpc.Provider
      client={trpcClient}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
