import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import { UserType } from "@/types/user.types";
import { useLaunchParams } from "@telegram-apps/sdk-react";

const useAuthenticate = () => {
  const lunchParams = useLaunchParams();
  const setUser = useUserStore((s) => s.setUser);
  const pageSearchParams = useSearchParams();

  const router = useRouter();

  return useQuery({
    queryKey: ["launch-params", lunchParams?.initData?.hash],
    queryFn: async () => {
      if (!lunchParams?.initDataRaw) {
        throw new Error("No Init Data");
      }

      const searchParams = new URLSearchParams({
        init_data: lunchParams?.initDataRaw,
      });

      const res = await fetch(`/api/v1/auth?${searchParams.toString()}`, {
        headers: { Accept: "application/json" },
        method: "GET",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error);

      const notAuthenticated = pageSearchParams.get("not_authenticated");

      if (notAuthenticated === "true") {
        router.refresh();
      }

      setUser(data.user as UserType);

      return data as { token: string };
    },
  });
};

export default useAuthenticate;