import { FC } from "react";

type Props = {
  title: string;
  description: string;
};

const SectionContent: FC<Props> = ({ title, description }) => {
  return (
    <div className="grid grid-cols-7 items-start justify-start gap-y-1.5 pt-4">
      <h1 className="type-title-1 col-span-6">{title}</h1>
      <p className="type-callout col-span-full">{description}</p>
    </div>
  );
};

export default SectionContent;
