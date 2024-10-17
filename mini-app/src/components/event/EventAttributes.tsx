import { FC, ReactNode } from "react";
import AttributeItem from "../blocks/AttributeItem";

type Props = {
  data: [string, ReactNode][];
};

const EventAttributes: FC<Props> = ({ data }) => {
  return (
    <div className="-mt-2 grid">
      {data.map(([key, value]) => {
        return key === "Date" ? (
          <AttributeItem
            key={key}
            label={key}
            value={value}
            isDate
          />
        ) : (
          <AttributeItem
            key={key}
            label={key}
            value={value}
            isDate={false}
          />
        );
      })}
    </div>
  );
};

export default EventAttributes;
