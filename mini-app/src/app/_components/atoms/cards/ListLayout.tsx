import { cn } from "@/utils";
import { Block, BlockHeader, BlockTitle, List, Preloader } from "konsta/react";
import React, { ReactNode } from "react";
import DataStatus from "../../molecules/alerts/DataStatus";
import StatusChip, { StatusChipProps } from "@/components/ui/status-chips";

interface FormBlockProps {
  children?: ReactNode;
  title?: string;
  description?: ReactNode;
  inset?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  label?: {
    text: string;
    variant?: StatusChipProps["variant"];
  };
}

const ListLayout = (props: FormBlockProps) => {

  return (
    <>
      <BlockTitle className="!mt-4 capitalize">
        {props.title}
        {props.label && (
          <StatusChip
            label={props.label.text}
            variant={props.label.variant}
          />
        )}
      </BlockTitle>
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
          <>
            {!props.isEmpty && (
              <List
                margin="!my-1"
                className="dark:hairline-zinc-700"
              >
                {props.children}
              </List>
            )}

            {props.isEmpty && (
              <div className="my-4">
                <DataStatus
                  title="Empty List"
                  status="not_found"
                />
              </div>
            )}
          </>
        )}
      </Block>
    </>
  );
};

export default ListLayout;
