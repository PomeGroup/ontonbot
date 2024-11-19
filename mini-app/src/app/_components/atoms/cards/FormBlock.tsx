import { Block, BlockTitle, List } from "konsta/react";
import React, { ReactNode } from "react";

const FormBlock = ({
  children,
  title,
}: {
  children?: ReactNode;
  title?: string;
}) => {
  return (
    <>
      <BlockTitle className="!mt-4 capitalize">{title}</BlockTitle>
      <Block
        inset
        strong
        title={title}
        className="!p-0"
      >
        <List margin="!my-1">{children}</List>
      </Block>
    </>
  );
};

export default FormBlock;
