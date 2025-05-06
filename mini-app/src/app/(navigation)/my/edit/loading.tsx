import { Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <div className="p-4">
      <Skeleton
        variant="rectangular"
        width="100%"
        height={80}
      />
      <Skeleton
        variant="text"
        width="60%"
      />
    </div>
  );
}
