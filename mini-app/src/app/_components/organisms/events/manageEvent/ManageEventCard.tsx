import Typography from "@/components/Typography";
import { ReactNode } from "react";

export type ManageEventCardProps = {
  title: ReactNode;
  children: ReactNode;
};

const ManageEventCard = (props: ManageEventCardProps) => {
  return (
    <div className="bg-white p-3 flex flex-col gap-4 rounded-2lg">
      {/* Title */}
      <Typography
        variant="title3"
        weight="normal"
        className="flex-1"
      >
        {props.title}
      </Typography>

      {/* Content */}
      {props.children}
    </div>
  );
};

export default ManageEventCard;
