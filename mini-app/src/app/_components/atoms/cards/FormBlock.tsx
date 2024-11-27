import { cn } from "@/utils";
import { Block, BlockHeader, BlockTitle, List } from "konsta/react";
import React, { ReactNode } from "react";

const FormBlock = ({
  children,
  title,
  description,
  inset = true,
}: {
  children?: ReactNode;
  title?: string;
  description?: ReactNode;
  inset?: boolean;
}) => {
  return (
    <>
      <BlockTitle className="!mt-4 capitalize">{title}</BlockTitle>
      {description && <BlockHeader>{description}</BlockHeader>}
      <Block
        inset
        strong
        title={title}
        className={cn("!p-0", { "!py-2": inset })}
      >
        <List
          margin="!my-1"
          className="dark:hairline-zinc-700"
        >
          {children}
        </List>
      </Block>
    </>
  );
};

export default FormBlock;
