import { FC, ReactNode } from "react";
import AttributeItem from "../blocks/AttributeItem";

type Props = {
  data: [string, ReactNode][];
};

const EventAttributes: FC<Props> = ({ data }) => {
  return (
    <div className="-mt-2 grid">
      {data.map((data) => {
        return <AttributeItem key={data[0]} label={data[0]} value={data[1]} />;
      })}
    </div>
  );
};

export default EventAttributes;
