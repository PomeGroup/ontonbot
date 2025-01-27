"use client";
import ManageEvent from "@/app/_components/organisms/events/ManageEvent";
import { Block, Page } from "konsta/react";


export default function CreateEventAdminPage() {
  return (
    <Page  className={"!py-0  min-h-screen overflow-auto mb-[calc(-1*(var(--tg-safe-area-inset-bottom)))]"}>
      {/*<Block className={"!p-0"} >*/}
       <ManageEvent />
      {/*</Block>*/}
    </Page>
  );
};


