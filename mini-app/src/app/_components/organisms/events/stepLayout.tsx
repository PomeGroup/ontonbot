import { Title3 } from "@/app/_components/atoms/typography/Titles";

export const StepLayout = (props: {
  children: React.ReactNode;
  title?: React.ReactNode;
}) => {
  return (
    <section className="py-4 space-y-8">
      {props.title && <Title3>{props.title}</Title3>}
      <>{props.children}</>
    </section>
  );
};
