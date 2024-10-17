import { LucideBug, LucideLoader2 } from "lucide-react"
import { FC, ReactNode } from "react"

type QueryStateProps = {
  isError?: boolean;
  text?: string;
  description?: string
  retry?: boolean;
  children?: ReactNode
};

const QueryState: FC<QueryStateProps> = ({ isError = false, text, description, children }) => {
  const Status = isError ? LucideBug : LucideLoader2;
  const statusProps = isError
    ? { fill: "#F43F5E" }
    : { className: "animate-spin duration-500" };

  return (
    <div className="h-screen w-screen bg-white flex flex-col gap-1 text-center items-center justify-center">
      <div className="flex  items-center justify-center gap-1 ">
        <Status {...statusProps} />
        <h1>{text || (isError ? "Error Occured" : "Loading")}</h1>
      </div>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
};

export default QueryState;
