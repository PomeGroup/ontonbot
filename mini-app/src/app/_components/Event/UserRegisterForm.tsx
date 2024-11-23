import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { ListInput, List, BlockTitle, BlockFooter } from "konsta/react";
import { useParams } from "next/navigation";
import React, { useRef } from "react";

const UserRegisterForm = () => {
  const params = useParams<{ hash: string }>();

  const registrationForm = useRef<HTMLFormElement>(null);
  const registerUser = trpc.events.eventRegister.useMutation();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    registerUser.mutate({
      input_data: {},
    });
    console.log("bnanna");
  };

  return (
    <>
      <BlockTitle className="!px-0">Registration Form</BlockTitle>
      <form
        ref={registrationForm}
        onSubmit={handleSubmit}
      >
        <List
          margin="!-mx-4"
          className="hairline-black"
        >
          <ListInput
            outline
            label="Full Name"
            name="full_name"
            required
            placeholder="John Doe"
          />
          <ListInput
            outline
            label="Company"
            name="company"
            required
            placeholder="Example Company"
          />
          <ListInput
            outline
            label="Position"
            name="position"
            required
            placeholder="Designer"
          />
          <ListInput
            outline
            info="Optional"
            placeholder="I will be 30min late"
            name="notes"
            label="Notes"
          />
        </List>
      </form>
      <BlockFooter>
        <KButton
          className="bg-primary"
          title="Submit"
          itemType="button"
          onClick={(e) => {
            e.preventDefault();
            registrationForm.current?.requestSubmit();
          }}
        >
          Submit
        </KButton>
      </BlockFooter>
    </>
  );
};
export default UserRegisterForm;
