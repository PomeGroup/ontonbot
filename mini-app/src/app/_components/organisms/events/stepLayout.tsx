import { Title3 } from "@/app/_components/atoms/typography/Titles";

export const StepLayout = (props: {
  children: React.ReactNode;
  title: React.ReactNode;
}) => {
  return (
    <section className="py-7 space-y-8">
      <Title3>{props.title}</Title3>
      <>{props.children}</>
    </section>
  );
};
