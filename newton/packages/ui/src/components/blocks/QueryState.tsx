import { FC, ReactNode } from "react";
import { LucideBug, LucideLoader2 } from "lucide-react"

type QueryStateProps = {
  isError?: boolean;
  text?: string;
  description?: string;
  retry?: boolean;
  children?: ReactNode;
};

const QueryState: FC<QueryStateProps> = ({
  isError = false,
  text,
  description,
  children,
}) => {
  const Status = isError ? LucideBug : LucideLoader2;
  const statusProps = isError
    ? { fill: "#F43F5E" }
    : { className: "animate-spin duration-500" };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-1 bg-white text-center">
      <div className="flex  items-center justify-center gap-1 ">
        <Status {...statusProps} />
        <h1>{text || (isError ? "Error Occurred" : "Loading")}</h1>
      </div>
      {description && <p className="whitespace-pre-line">{description}</p>}
      {children}
    </div>
  );
};

export default QueryState;
