import useWebApp from "@/hooks/useWebApp";
import { isTelegramUrl } from "@tonconnect/ui-react";
import { cva, VariantProps } from "class-variance-authority";
import React, { ReactNode } from "react";

const eventKeyValueCva = cva("p", {
  variants: {
    variant: {
      base: "",
      filled_value: ["bg-zinc-100 rounded-md"],
      link: "text-blue-500 truncate cursor-pointer text-center",
    },
  },
  compoundVariants: [{ variant: "base" }],
  defaultVariants: {
    variant: "base",
  },
});

export interface EventKeyValueProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof eventKeyValueCva> {
  label: string;
  value: ReactNode | string;
}

const EventKeyValue = (props: EventKeyValueProps) => {
  const webApp = useWebApp();

  return (
    <div className="flex items-center justify-between">
      <label className="text-left text-sm text-cn-muted-foreground flex-1">
        {props.label}
      </label>
      <p
        className={eventKeyValueCva({
          className: "flex-1 text-sm p-1 text-black",
          variant: props.variant,
        })}
        onClick={() => {
          if (props.variant === "link" && typeof props.value === "string") {
            if (isTelegramUrl(props.value)) {
              webApp?.openTelegramLink(props.value);
            } else {
              webApp?.openLink(props.value);
            }
          }
        }}
      >
        {props.variant === "link" && typeof props.value === "string"
          ? props.value.replace(/^https?:\/\//, "")
          : props.value}
      </p>
    </div>
  );
};

export default EventKeyValue;
