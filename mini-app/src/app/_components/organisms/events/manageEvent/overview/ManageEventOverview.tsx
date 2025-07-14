import { useMemo } from "react";
import { useEventValidation } from "../hooks/useEventValidation";
import ManageEventCard from "../ManageEventCard";

export const ManageEventOverview = () => {
  const { ensureValidOrRedirect } = useEventValidation();

  const res = useMemo(() => {
    return ensureValidOrRedirect({ redirectPath: "/my" });
  }, []);

  if (!res.success) {
    return null;
  }

  return (
    <div className="p-4">
      <ManageEventCard title="Overview">Yo</ManageEventCard>;
    </div>
  );
};
