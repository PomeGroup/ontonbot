import { cn } from "@/utils";
import { Block, BlockHeader, BlockTitle, List, Preloader } from "konsta/react";
import React, { ReactNode } from "react";

interface FormBlockProps {
  children?: ReactNode;
  title?: string;
  description?: ReactNode;
  inset?: boolean;
  isLoading?: boolean;
}

const FormBlock = (props: FormBlockProps) => {
  return (
    <>
      <BlockTitle className="!mt-4 capitalize">{props.title}</BlockTitle>
      {props.description && <BlockHeader>{props.description}</BlockHeader>}
      <Block
        inset
        strong
        title={props.title}
        className={cn("!p-0", { "!py-2": props.inset })}
      >
        {props.isLoading && (
          <div className="flex flex-col gap-2 items-center justify-center py-8">
            <Preloader title="loading" />
            <p>Loading</p>
          </div>
        )}

        {!props.isLoading && (
          <List
            margin="!my-1"
            className="dark:hairline-zinc-700"
          >
            {props.children}
          </List>
        )}
      </Block>
    </>
  );
};

export default FormBlock;
