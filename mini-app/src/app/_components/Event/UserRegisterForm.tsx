import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { EventRegisterSchema } from "@/types";
import { ListInput, List, BlockTitle, Preloader } from "konsta/react";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

const UserRegisterForm = () => {
  const params = useParams<{ hash: string }>();
  const registrationForm = useRef<HTMLFormElement>(null);

  const [formErrors, setErrors] = useState<{
    full_name?: string[];
    company?: string[];
    position?: string[];
    linkedin?: string[];
    github?: string[];
    notes?: string[];
  }>();

  const trpcUtils = trpc.useUtils();
  const registerUser = trpc.registrant.eventRegister.useMutation({
    onError: (error) => {
      toast.error(error.data?.code + ": " + error.message);
    },
    onSuccess() {
      trpcUtils.events.getEvent.refetch();
    },
  });

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
        <List margin="!-mx-4">
          <ListInput
            outline
            label="Full Name"
            name="full_name"
            error={formErrors?.full_name?.[0]}
            placeholder="John Doe"
          />
          <ListInput
            outline
            label="Company"
            name="company"
            error={formErrors?.company?.[0]}
            placeholder="Example Company"
          />
          <ListInput
            outline
            label="Position"
            name="position"
            error={formErrors?.position?.[0]}
            placeholder="Designer"
          />
          <ListInput
            outline
            label="LinkedIn"
            name="linkedin"
            error={formErrors?.linkedin?.[0]}
            placeholder="https://www.linkedin.com/in/john"
          />
          <ListInput
            outline
            label="Github"
            name="github"
            error={formErrors?.github?.[0]}
            placeholder="john_doe"
          />
          <ListInput
            outline
            info="Optional"
            placeholder="I will be 30min late"
            name="notes"
            error={formErrors?.notes?.[0]}
            label="Additional information"
          />
        </List>
        <Button
          variant={"primary"}
          className="w-full"
          title="Submit"
          itemType="button"
          disabled={registerUser.isLoading}
          onClick={(e) => {
            e.preventDefault();
            registrationForm.current?.requestSubmit();
          }}
        >
          {registerUser.isLoading ? <Preloader size="w-4 h-4" /> : "Request to Join"}
        </Button>
      </form>

    </>
  );
};
export default UserRegisterForm;
