"use client";

import React, { ReactNode } from "react";
import { useUtils } from "@tma.js/sdk-react";
import { isTelegramUrl } from "@tonconnect/ui-react";
import { cva, VariantProps } from "class-variance-authority";

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
  const webApp = useUtils();

  return (
    <div className="flex w-full items-center justify-between">
      <label className="text-cn-muted-foreground flex-1 text-left text-sm">
        {props.label}
      </label>
      <p
        className={eventKeyValueCva({
          className: "flex-1 p-1 text-right text-sm text-black",
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
