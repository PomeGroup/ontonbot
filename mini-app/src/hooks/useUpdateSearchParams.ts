import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const useUpdateSearchParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (name: string, value: string, opts?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      if (opts?.replace) {
        router.replace(`${pathname}?${params.toString()}`);
      } else {
        router.push(`${pathname}?${params.toString()}`);
      }
    },
    [searchParams]
  );
};
