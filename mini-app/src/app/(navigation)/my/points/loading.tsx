import { Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <div className="p-4">
      <Skeleton
        variant="rectangular"
        width="100%"
        height={100}
      />
      <Skeleton
        variant="text"
        width="80%"
      />
    </div>
  );
}
