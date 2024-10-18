"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/react-query";
import React, { useEffect, useRef, useState } from "react";
import { trpc } from "./client";
import { type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable react-query retry since we handle it in our link
      cacheTime: 60 * 1000,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const initDataExpirationAlert = () => {
  sessionStorage.removeItem("telegram:initParams");

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showPopup(
      {
        message: "Your session has expired. Please restart the app.",
        buttons: [{ text: "OK", type: "close" }],
      },
      () => {
        window.Telegram.WebApp.close();
      }
    );
  }
};

const createCombinedLink = (): TRPCLink<any> => {
  return () => {
    return (opts) => {
      return observable((observer) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 3;

        function attempt() {
          return opts.next(opts.op).subscribe({
            next(value) {
              observer.next(value);
            },
            error(err) {
              // Handle unauthorized error
              if (err.data?.code === "UNAUTHORIZED") {
                console.error("UNAUTHORIZED error in response:", err);
                initDataExpirationAlert();
                observer.error(err);
                return;
              }

              // Handle 500 errors with retry
              const shouldRetry =
                err.data?.httpStatus === 500 ||
                err.data?.httpStatus === 502 ||
                err.data?.httpStatus === 503 ||
                err.data?.httpStatus === 504;
              if (shouldRetry && attempts < MAX_ATTEMPTS) {
                attempts++;
                // Exponential backoff delay
                const delay = Math.min(1000 * 2 ** attempts, 5000);
                setTimeout(attempt, delay);
                return;
              }

              observer.error(err);
            },
            complete() {
              observer.complete();
            },
          });
        }

        return attempt();
      });
    };
  };
};

export default function Provider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const trpcClientRef = useRef<ReturnType<typeof trpc.createClient> | null>(
    null
  );

  useEffect(() => {
    const initializeTrpcClient = () => {
      if (
        typeof window !== "undefined" &&
        window.Telegram?.WebApp?.initData &&
        !isInitialized
      ) {
        const webAppInitData = window.Telegram.WebApp.initData;

        trpcClientRef.current = trpc.createClient({
          links: [
            createCombinedLink(),
            httpLink({
              url: "/api/trpc",
              headers: {
                Authorization: `Bearer ${webAppInitData}`,
              },
            }),
          ],
        });

        setIsInitialized(true);
      }
    };

    initializeTrpcClient();

    const intervalId = setInterval(() => {
      if (!isInitialized) {
        initializeTrpcClient();
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, [isInitialized]);

  if (!isInitialized || !trpcClientRef.current) {
    return null;
  }

  return (
    <trpc.Provider
      client={trpcClientRef.current}
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
