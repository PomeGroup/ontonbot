import Image from "next/image";
import AttributeItem from "@/components/blocks/AttributeItem";

import { TicketAttributes as TA } from "@/types/ticket.types";

const mockData: TA = [
  [
    "Owner",
    // eslint-disable-next-line react/jsx-key
    <div className={"inline-flex"}>
      <div className={"relative h-6 w-6"}>
        <Image
          fill
          src={
            // FIXME what is this?
            "https://s3-alpha-sig.figma.com/img/4b12/a862/ef41b0b2bc030ef065bcdd82615c7cc3?Expires=1717977600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=ldXV1p5AuHBvveQkUmGhLQDSp21ccDgxwbJPeZGoBU17oewweWzZLm7IWS8EQ5Nd-9VcwSXZ4F1s9WA-MMiLQ4QmyuFTnoEfxofrnAF~GiGhNa3I33bQBsZVuusv4zNeUcNaIj13qGe0qoWjSyNryqUdGTwCugH14qg1rUYmMfV2hnL2TEscfCkW7BjoWfUIp18dcImHcSjKp0kU0z7xY-JD34RM9Exc9-a0qi5rr6mPYWekspH~tz~B4MgAX19ulcuvsWiEPuFl3rWu92CdUnDRkzKsa5VSatCQSizSMSS~75U98sCg6xhnXtdBmV9SvnGr97wDG0XiIXSO0dX~Kw__"
          }
          alt={"Owner Avatar"}
          unoptimized
        />
      </div>
      <span>@natalialoss</span>
    </div>,
  ],
  ["Contract address", "EQcj...Bdkm"],
];

const TicketAttributes = ({ data = mockData }: { data: TA }) => {
  return (
    <div className="-mt-2 grid">
      {data.map((data) => {
        return <AttributeItem key={data[0]} label={data[0]} value={data[1]} />;
      })}
    </div>
  );
};

export default TicketAttributes;
