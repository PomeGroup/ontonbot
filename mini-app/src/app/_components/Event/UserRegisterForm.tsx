import { trpc } from "@/app/_trpc/client";
import { KButton } from "@/components/ui/button";
import { EventRegisterSchema } from "@/types";
import { ListInput, List, BlockTitle, BlockFooter, Preloader } from "konsta/react";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";

const UserRegisterForm = () => {
  const params = useParams<{ hash: string }>();
  const [formErrors, setErrors] = useState<{
    full_name?: string[];
    company?: string[];
    position?: string[];
    notes?: string[];
  }>();

  const registrationForm = useRef<HTMLFormElement>(null);
  const registerUser = trpc.events.eventRegister.useMutation();

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();

    if (!registrationForm.current) {
      return;
    }
    const formData = new FormData(registrationForm.current);
    const formObject = Object.fromEntries(formData.entries());
    const registrationData = {
      event_uuid: params.hash,
      ...formObject,
    };

    const parsedData = EventRegisterSchema.safeParse(registrationData);

    if (parsedData.error) {
      setErrors(parsedData.error.flatten().fieldErrors);
      return;
    }
    setErrors(undefined);

    registerUser.mutate(parsedData.data);
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
            error={formErrors?.full_name?.[0]}
            placeholder="John Doe"
          />
          <ListInput
            outline
            label="Company"
            name="company"
            required
            error={formErrors?.company?.[0]}
            placeholder="Example Company"
          />
          <ListInput
            outline
            label="Position"
            name="position"
            required
            error={formErrors?.position?.[0]}
            placeholder="Designer"
          />
          <ListInput
            outline
            info="Optional"
            placeholder="I will be 30min late"
            name="notes"
            error={formErrors?.notes?.[0]}
            label="Notes"
          />
        </List>
      </form>
      <BlockFooter>
        <KButton
          className="bg-primary"
          title="Submit"
          itemType="button"
          disabled={registerUser.isLoading}
          onClick={(e) => {
            e.preventDefault();
            registrationForm.current?.requestSubmit();
          }}
        >
          {registerUser.isLoading ? <Preloader size="w-4 h-4" /> : "Submit"}
        </KButton>
      </BlockFooter>
    </>
  );
};
export default UserRegisterForm;
